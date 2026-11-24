import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { pool } from '../db/pool.ts'
import { migrate } from '../db/migrate.ts'
import { DEMO_EVENT_CAPACITY, DEMO_EVENT_ID, resetDemoEvent } from '../db/seed.ts'
import { allocateReservation } from './allocation.ts'
import { getEventInventory } from './inventory.ts'
import { runConcurrentReservationExperiment } from './experiments.ts'
import { reconcileEvent, summariseOutcomes } from './reconcile.ts'

describe('reservation allocation against PostgreSQL', () => {
  beforeAll(async () => {
    await migrate()
  })

  beforeEach(async () => {
    await resetDemoEvent()
  })

  afterAll(async () => {
    await pool.end()
  })

  it('allocates all-or-nothing multi-ticket reservations', async () => {
    const outcome = await allocateReservation(DEMO_EVENT_ID, 3, 'interactive')
    expect(outcome.status).toBe('allocated')
    if (outcome.status !== 'allocated') return

    const inventory = await getEventInventory()
    expect(inventory?.allocatedTickets).toBe(3)
    expect(inventory?.successfulReservationCount).toBe(1)
    expect(inventory?.availableTickets).toBe(DEMO_EVENT_CAPACITY - 3)
  })

  it('rejects invalid quantities without consuming inventory', async () => {
    const zero = await allocateReservation(DEMO_EVENT_ID, 0, 'interactive')
    const negative = await allocateReservation(DEMO_EVENT_ID, -2, 'interactive')
    const fractional = await allocateReservation(DEMO_EVENT_ID, 1.5, 'interactive')

    expect(zero.status).toBe('rejected')
    expect(negative.status).toBe('rejected')
    expect(fractional.status).toBe('rejected')

    const inventory = await getEventInventory()
    expect(inventory?.allocatedTickets).toBe(0)
    expect(inventory?.successfulReservationCount).toBe(0)
  })

  it('does not consume inventory on authoritative availability rejection', async () => {
    const first = await allocateReservation(
      DEMO_EVENT_ID,
      DEMO_EVENT_CAPACITY,
      'interactive',
    )
    expect(first.status).toBe('allocated')

    const rejected = await allocateReservation(DEMO_EVENT_ID, 1, 'generated')
    expect(rejected.status).toBe('rejected')
    if (rejected.status === 'rejected') {
      expect(rejected.reason).toBe('insufficient_inventory')
    }

    const inventory = await getEventInventory()
    expect(inventory?.allocatedTickets).toBe(DEMO_EVENT_CAPACITY)
    expect(inventory?.successfulReservationCount).toBe(1)
    expect(inventory?.availableTickets).toBe(0)
  })

  it('prevents overselling under competing requests and reconciles counts vs tickets', async () => {
    const jobs = Array.from({ length: 40 }, (_, index) =>
      allocateReservation(
        DEMO_EVENT_ID,
        5,
        index === 0 ? 'interactive' : 'generated',
      ),
    )

    const outcomes = await Promise.all(jobs)
    const summary = summariseOutcomes(
      outcomes.map((outcome) => {
        if (outcome.status === 'allocated') {
          return {
            kind: outcome.requesterKind,
            status: 'allocated' as const,
            reservationId: outcome.reservationId,
            quantity: outcome.quantity,
          }
        }
        return {
          kind: outcome.requesterKind,
          status: 'rejected' as const,
          reason: outcome.reason,
          quantity: outcome.quantity,
          available: outcome.available,
        }
      }),
    )

    expect(summary.allocatedTicketQuantity).toBeLessThanOrEqual(DEMO_EVENT_CAPACITY)
    expect(summary.successfulReservationCount * 5).toBe(
      summary.allocatedTicketQuantity,
    )

    const reconciliation = await reconcileEvent(
      DEMO_EVENT_ID,
      summary.allocatedTicketQuantity,
    )
    expect(reconciliation.oversold).toBe(false)
    expect(reconciliation.balances).toBe(true)
    expect(reconciliation.allocatedTicketQuantity).toBe(
      summary.allocatedTicketQuantity,
    )
    expect(reconciliation.successfulReservationCount).toBe(
      summary.successfulReservationCount,
    )
    expect(
      reconciliation.allocatedTicketQuantity + reconciliation.remainingInventory,
    ).toBe(DEMO_EVENT_CAPACITY)
  })

  it('runs a constrained concurrent experiment without preferential interactive treatment mechanics', async () => {
    const result = await runConcurrentReservationExperiment(
      {
        userQuantity: 2,
        competingRequests: 80,
        concurrency: 20,
      },
      { reset: true },
    )

    expect(result.correctness.noOversell).toBe(true)
    expect(result.correctness.balances).toBe(true)
    expect(result.summary.allocatedTicketQuantity).toBeLessThanOrEqual(
      DEMO_EVENT_CAPACITY,
    )
    expect(
      result.reconciliation.allocatedTicketQuantity +
        result.reconciliation.remainingInventory,
    ).toBe(DEMO_EVENT_CAPACITY)
    expect(result.personalOutcome).not.toBeNull()
  })

  it('allows oversubscribed demand and resolves scarcity via allocation', async () => {
    const userQuantity = 10
    const competingRequests = 150
    const ticketDemand = userQuantity + competingRequests
    expect(ticketDemand).toBeGreaterThan(DEMO_EVENT_CAPACITY)

    const result = await runConcurrentReservationExperiment(
      {
        userQuantity,
        competingRequests,
        concurrency: 20,
      },
      { reset: true },
    )

    expect(result.summary.requestCount).toBe(competingRequests + 1)
    expect(result.summary.allocatedTicketQuantity).toBeLessThanOrEqual(
      DEMO_EVENT_CAPACITY,
    )
    expect(result.summary.availabilityRejectionCount).toBeGreaterThan(0)
    expect(result.correctness.noOversell).toBe(true)
    expect(result.correctness.balances).toBe(true)
    expect(
      result.reconciliation.allocatedTicketQuantity +
        result.reconciliation.remainingInventory,
    ).toBe(DEMO_EVENT_CAPACITY)
  })
})


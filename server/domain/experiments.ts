import { randomUUID } from 'node:crypto'
import {
  EXPERIMENT_LIMITS,
  parseBookingPolicy,
  validateExperimentConfig,
} from '../../shared/experiment-config.ts'
import { pool } from '../db/pool.ts'
import { DEMO_EVENT_ID, resetDemoEvent } from '../db/seed.ts'
import { allocateReservation } from './allocation.ts'
import { getEventInventory } from './inventory.ts'
import { reconcileEvent, summariseOutcomes } from './reconcile.ts'
import type {
  BookingPolicy,
  ExperimentConfig,
  ExperimentRequestOutcome,
  RequesterKind,
} from './types.ts'

export { EXPERIMENT_LIMITS, validateExperimentConfig, parseBookingPolicy }

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function runWorker() {
    while (true) {
      const current = nextIndex
      nextIndex += 1
      if (current >= items.length) return
      results[current] = await worker(items[current], current)
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker(),
  )
  await Promise.all(workers)
  return results
}

async function runOneAllocation(
  eventId: string,
  quantity: number,
  kind: RequesterKind,
  experimentRunId: string,
): Promise<ExperimentRequestOutcome> {
  try {
    const outcome = await allocateReservation(
      eventId,
      quantity,
      kind,
      experimentRunId,
    )
    if (outcome.status === 'allocated') {
      return {
        kind,
        status: 'allocated',
        reservationId: outcome.reservationId,
        quantity: outcome.quantity,
      }
    }
    return {
      kind,
      status: 'rejected',
      reason: outcome.reason,
      quantity: outcome.quantity,
      available: outcome.available,
    }
  } catch (error) {
    return {
      kind,
      status: 'error',
      quantity,
      message: error instanceof Error ? error.message : 'Unknown allocation error',
    }
  }
}

function shuffleJobs<T>(jobs: T[]): T[] {
  const copy = [...jobs]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export async function runConcurrentReservationExperiment(
  config: ExperimentConfig,
  options: { reset?: boolean; eventId?: string } = {},
) {
  const validationError = validateExperimentConfig(config)
  if (validationError) {
    throw new Error(validationError)
  }

  const bookingPolicy: BookingPolicy =
    parseBookingPolicy(config.bookingPolicy) ?? 'standard'
  const normalisedConfig: ExperimentConfig = {
    ...config,
    bookingPolicy,
  }

  const eventId = options.eventId ?? DEMO_EVENT_ID
  if (options.reset !== false) {
    await resetDemoEvent()
  }

  const inventoryBefore = await getEventInventory(eventId)
  if (!inventoryBefore) {
    throw new Error(`Event not found: ${eventId}`)
  }

  const experimentRunId = randomUUID()
  await pool.query(
    `
      INSERT INTO experiment_runs
        (id, event_id, user_quantity, competing_requests, concurrency, booking_policy)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      experimentRunId,
      eventId,
      normalisedConfig.userQuantity,
      normalisedConfig.competingRequests,
      normalisedConfig.concurrency,
      bookingPolicy,
    ],
  )

  type Job = { kind: RequesterKind; quantity: number }
  const interactiveJob: Job = {
    kind: 'interactive',
    quantity: normalisedConfig.userQuantity,
  }
  const competitorJobs: Job[] = Array.from(
    { length: normalisedConfig.competingRequests },
    () => ({
      kind: 'generated' as const,
      quantity: 1,
    }),
  )

  let outcomes: ExperimentRequestOutcome[]

  if (bookingPolicy === 'vip') {
    // VIP-first: interactive allocation completes before competitors are admitted.
    const personalOutcome = await runOneAllocation(
      eventId,
      interactiveJob.quantity,
      interactiveJob.kind,
      experimentRunId,
    )
    const competitorOutcomes =
      competitorJobs.length === 0
        ? []
        : await mapPool(competitorJobs, normalisedConfig.concurrency, (job) =>
            runOneAllocation(eventId, job.quantity, job.kind, experimentRunId),
          )
    outcomes = [personalOutcome, ...competitorOutcomes]
  } else {
    const jobs = shuffleJobs([interactiveJob, ...competitorJobs])
    outcomes = await mapPool(jobs, normalisedConfig.concurrency, (job) =>
      runOneAllocation(eventId, job.quantity, job.kind, experimentRunId),
    )
  }

  const personalOutcome =
    outcomes.find((outcome) => outcome.kind === 'interactive') ?? null
  const summary = summariseOutcomes(outcomes)
  const reconciliation = await reconcileEvent(
    eventId,
    summary.allocatedTicketQuantity,
  )
  const inventoryAfter = await getEventInventory(eventId)

  return {
    experimentRunId,
    config: normalisedConfig,
    inventoryBefore,
    inventoryAfter,
    personalOutcome,
    outcomes,
    summary,
    reconciliation,
    correctness: {
      noOversell: !reconciliation.oversold,
      balances: reconciliation.balances,
      unexpectedErrorCount: summary.unexpectedErrorCount,
    },
  }
}

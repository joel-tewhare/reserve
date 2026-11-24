import { randomUUID } from 'node:crypto'
import type pg from 'pg'
import { withTransaction } from '../db/pool.ts'
import type { AllocationOutcome, RequesterKind } from './types.ts'

export function validateQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0
}

export async function allocateReservation(
  eventId: string,
  quantity: number,
  requesterKind: RequesterKind,
  experimentRunId: string | null = null,
): Promise<AllocationOutcome> {
  if (!validateQuantity(quantity)) {
    return {
      status: 'rejected',
      reason: 'invalid_quantity',
      eventId,
      quantity,
      requesterKind,
      available: 0,
    }
  }

  return withTransaction(async (client) =>
    allocateWithClient(client, eventId, quantity, requesterKind, experimentRunId),
  )
}

export async function allocateWithClient(
  client: pg.PoolClient,
  eventId: string,
  quantity: number,
  requesterKind: RequesterKind,
  experimentRunId: string | null = null,
): Promise<AllocationOutcome> {
  if (!validateQuantity(quantity)) {
    return {
      status: 'rejected',
      reason: 'invalid_quantity',
      eventId,
      quantity,
      requesterKind,
      available: 0,
    }
  }

  const eventResult = await client.query<{ capacity: number }>(
    `SELECT capacity FROM events WHERE id = $1 FOR UPDATE`,
    [eventId],
  )
  const event = eventResult.rows[0]
  if (!event) {
    throw new Error(`Event not found: ${eventId}`)
  }

  const allocatedResult = await client.query<{ allocated: string }>(
    `SELECT COALESCE(SUM(quantity), 0)::text AS allocated FROM reservations WHERE event_id = $1`,
    [eventId],
  )
  const allocated = Number(allocatedResult.rows[0]?.allocated ?? 0)
  const available = event.capacity - allocated

  if (quantity > available) {
    return {
      status: 'rejected',
      reason: 'insufficient_inventory',
      eventId,
      quantity,
      requesterKind,
      available,
    }
  }

  const reservationId = randomUUID()
  await client.query(
    `
      INSERT INTO reservations (id, event_id, quantity, requester_kind, experiment_run_id)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [reservationId, eventId, quantity, requesterKind, experimentRunId],
  )

  return {
    status: 'allocated',
    reservationId,
    eventId,
    quantity,
    requesterKind,
  }
}

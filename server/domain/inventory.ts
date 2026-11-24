import type pg from 'pg'
import { pool } from '../db/pool.ts'
import { DEMO_EVENT_ID } from '../db/seed.ts'
import type { EventInventory } from './types.ts'

export async function getEventInventory(
  eventId = DEMO_EVENT_ID,
  client: pg.Pool | pg.PoolClient = pool,
): Promise<EventInventory | null> {
  const result = await client.query<{
    id: string
    name: string
    capacity: number
    allocated_tickets: string
    reservation_count: string
  }>(
    `
      SELECT
        e.id,
        e.name,
        e.capacity,
        COALESCE(SUM(r.quantity), 0)::text AS allocated_tickets,
        COUNT(r.id)::text AS reservation_count
      FROM events e
      LEFT JOIN reservations r ON r.event_id = e.id
      WHERE e.id = $1
      GROUP BY e.id, e.name, e.capacity
    `,
    [eventId],
  )

  const row = result.rows[0]
  if (!row) return null

  const allocatedTickets = Number(row.allocated_tickets)
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    allocatedTickets,
    availableTickets: row.capacity - allocatedTickets,
    successfulReservationCount: Number(row.reservation_count),
  }
}

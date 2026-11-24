import { pool } from './pool.ts'

export const DEMO_EVENT_ID = 'demo-summit'
export const DEMO_EVENT_NAME = 'Reserve Engineering Summit'
export const DEMO_EVENT_CAPACITY = 100

export async function seedDemoEvent(): Promise<void> {
  await pool.query(
    `
      INSERT INTO events (id, name, capacity)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          capacity = EXCLUDED.capacity
    `,
    [DEMO_EVENT_ID, DEMO_EVENT_NAME, DEMO_EVENT_CAPACITY],
  )
}

export async function resetDemoEvent(): Promise<void> {
  await pool.query('DELETE FROM reservations WHERE event_id = $1', [
    DEMO_EVENT_ID,
  ])
  await pool.query('DELETE FROM experiment_runs WHERE event_id = $1', [
    DEMO_EVENT_ID,
  ])
  await seedDemoEvent()
}

import { pool } from './pool.ts'

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL CHECK (capacity >= 0)
    );

    CREATE TABLE IF NOT EXISTS experiment_runs (
      id UUID PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id),
      user_quantity INTEGER NOT NULL CHECK (user_quantity > 0),
      competing_requests INTEGER NOT NULL CHECK (competing_requests >= 0),
      concurrency INTEGER NOT NULL CHECK (concurrency > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE experiment_runs
      ADD COLUMN IF NOT EXISTS booking_policy TEXT NOT NULL DEFAULT 'standard';

    UPDATE experiment_runs
    SET booking_policy = 'standard'
    WHERE booking_policy IS NULL
       OR booking_policy NOT IN ('standard', 'vip');



    CREATE TABLE IF NOT EXISTS reservations (
      id UUID PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      requester_kind TEXT NOT NULL CHECK (requester_kind IN ('interactive', 'generated')),
      experiment_run_id UUID REFERENCES experiment_runs(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS reservations_event_id_idx
      ON reservations (event_id);

    CREATE INDEX IF NOT EXISTS reservations_experiment_run_id_idx
      ON reservations (experiment_run_id);
  `)
}

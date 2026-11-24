import { migrate } from '../server/db/migrate.ts'
import { resetDemoEvent } from '../server/db/seed.ts'
import { pool } from '../server/db/pool.ts'

async function main() {
  await migrate()
  await resetDemoEvent()
  await pool.end()
  console.log('Demo event reset to known initial conditions.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

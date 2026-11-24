import server from './server.ts'
import { migrate } from './db/migrate.ts'
import { seedDemoEvent } from './db/seed.ts'

const PORT = process.env.PORT || 3000

async function start() {
  await migrate()
  await seedDemoEvent()

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log('Server listening on port', PORT)
  })
}

start().catch((error) => {
  console.error('Failed to start server', error)
  process.exit(1)
})

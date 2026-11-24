import express from 'express'
import * as Path from 'node:path'
import eventRoutes from './routes/events.ts'
import reservationRoutes from './routes/reservations.ts'
import experimentRoutes from './routes/experiments.ts'

const server = express()

server.use(express.json())

server.get('/api/v1/health', (_req, res) => {
  res.json({ ok: true })
})

server.use('/api/v1/events', eventRoutes)
server.use('/api/v1/reservations', reservationRoutes)
server.use('/api/v1/experiments', experimentRoutes)

server.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error)
    res.status(500).json({
      message: 'Something went wrong',
      outcomeKind: 'unexpected_error',
    })
  },
)

if (process.env.NODE_ENV === 'production') {
  server.use(express.static(Path.resolve('public')))
  server.use('/assets', express.static(Path.resolve('./dist/assets')))
  server.get('*', (req, res) => {
    res.sendFile(Path.resolve('./dist/index.html'))
  })
}

export default server

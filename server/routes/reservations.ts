import { Router } from 'express'
import { StatusCodes } from 'http-status-codes'
import { DEMO_EVENT_ID } from '../db/seed.ts'
import { allocateReservation } from '../domain/allocation.ts'
import { getEventInventory } from '../domain/inventory.ts'

const router = Router()

router.post('/', async (req, res, next) => {
  try {
    const quantity = Number(req.body?.quantity)
    const eventId =
      typeof req.body?.eventId === 'string' ? req.body.eventId : DEMO_EVENT_ID

    const outcome = await allocateReservation(eventId, quantity, 'interactive')
    const inventory = await getEventInventory(eventId)

    if (outcome.status === 'rejected') {
      const status =
        outcome.reason === 'invalid_quantity'
          ? StatusCodes.BAD_REQUEST
          : StatusCodes.CONFLICT
      res.status(status).json({ outcome, event: inventory })
      return
    }

    res.status(StatusCodes.CREATED).json({ outcome, event: inventory })
  } catch (error) {
    next(error)
  }
})

export default router

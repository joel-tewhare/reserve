import { Router } from 'express'
import { StatusCodes } from 'http-status-codes'
import { resetDemoEvent, DEMO_EVENT_ID } from '../db/seed.ts'
import { getEventInventory } from '../domain/inventory.ts'

const router = Router()

router.get('/demo', async (_req, res, next) => {
  try {
    const inventory = await getEventInventory(DEMO_EVENT_ID)
    if (!inventory) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'Demo event not found' })
      return
    }
    res.json({ event: inventory })
  } catch (error) {
    next(error)
  }
})

router.post('/demo/reset', async (_req, res, next) => {
  try {
    await resetDemoEvent()
    const inventory = await getEventInventory(DEMO_EVENT_ID)
    res.json({ event: inventory })
  } catch (error) {
    next(error)
  }
})

export default router

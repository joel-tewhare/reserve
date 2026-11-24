import { Router } from 'express'
import { StatusCodes } from 'http-status-codes'
import {
  EXPERIMENT_LIMITS,
  parseBookingPolicy,
  runConcurrentReservationExperiment,
  validateExperimentConfig,
} from '../domain/experiments.ts'
import type { ExperimentConfig } from '../domain/types.ts'

const router = Router()

router.get('/limits', (_req, res) => {
  res.json({ limits: EXPERIMENT_LIMITS })
})

router.post('/runs', async (req, res, next) => {
  try {
    const bookingPolicy = parseBookingPolicy(req.body?.bookingPolicy)
    if (bookingPolicy === null) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Booking policy must be standard or vip.',
      })
      return
    }

    const config: ExperimentConfig = {
      userQuantity: Number(req.body?.userQuantity),
      competingRequests: Number(req.body?.competingRequests),
      concurrency: Number(req.body?.concurrency),
      bookingPolicy,
    }

    const validationError = validateExperimentConfig(config)
    if (validationError) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: validationError })
      return
    }

    const result = await runConcurrentReservationExperiment(config, {
      reset: req.body?.reset !== false,
    })

    res.status(StatusCodes.CREATED).json(result)
  } catch (error) {
    next(error)
  }
})

export default router

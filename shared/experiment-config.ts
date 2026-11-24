export const EXPERIMENT_LIMITS = {
  maxUserQuantity: 10,
  maxCompetingRequests: 250,
  maxConcurrency: 25,
  maxTotalRequests: 260,
} as const

export type BookingPolicy = 'standard' | 'vip'

export type ExperimentConfigInput = {
  userQuantity: number
  competingRequests: number
  concurrency: number
  bookingPolicy?: BookingPolicy
}

export function parseBookingPolicy(value: unknown): BookingPolicy | null {
  if (value === undefined || value === null || value === '') {
    return 'standard'
  }
  if (value === 'standard' || value === 'vip') {
    return value
  }
  return null
}

/** Resource-protection limits only. Demand may exceed available inventory. */
export function validateExperimentConfig(
  config: ExperimentConfigInput,
): string | null {
  const errors = getExperimentConfigErrors(config)
  return errors[0] ?? null
}

export function getExperimentConfigErrors(
  config: ExperimentConfigInput,
): string[] {
  const { userQuantity, competingRequests, concurrency } = config
  const errors: string[] = []

  if (!Number.isInteger(userQuantity) || userQuantity < 1) {
    errors.push('Ticket quantity must be an integer of at least 1.')
  } else if (userQuantity > EXPERIMENT_LIMITS.maxUserQuantity) {
    errors.push(
      `Ticket quantity must be at most ${EXPERIMENT_LIMITS.maxUserQuantity}.`,
    )
  }

  if (!Number.isInteger(competingRequests) || competingRequests < 0) {
    errors.push('Competing customer requests must be an integer of at least 0.')
  } else if (competingRequests > EXPERIMENT_LIMITS.maxCompetingRequests) {
    errors.push(
      `Competing customer requests must be at most ${EXPERIMENT_LIMITS.maxCompetingRequests}.`,
    )
  }

  if (!Number.isInteger(concurrency) || concurrency < 1) {
    errors.push('Concurrency must be an integer of at least 1.')
  } else if (concurrency > EXPERIMENT_LIMITS.maxConcurrency) {
    errors.push(
      `Concurrency must be at most ${EXPERIMENT_LIMITS.maxConcurrency}.`,
    )
  }

  const totalRequests = competingRequests + 1
  if (
    Number.isInteger(competingRequests) &&
    competingRequests >= 0 &&
    totalRequests > EXPERIMENT_LIMITS.maxTotalRequests
  ) {
    errors.push(
      `Total requests (you + competitors) must be at most ${EXPERIMENT_LIMITS.maxTotalRequests}.`,
    )
  }

  if (config.bookingPolicy !== undefined) {
    const policy = parseBookingPolicy(config.bookingPolicy)
    if (policy === null) {
      errors.push('Booking policy must be standard or vip.')
    }
  }

  return errors
}

export function projectedTicketDemand(
  userQuantity: number,
  competingRequests: number,
): number {
  if (!Number.isFinite(userQuantity) || !Number.isFinite(competingRequests)) {
    return 0
  }
  return Math.max(0, userQuantity) + Math.max(0, competingRequests)
}

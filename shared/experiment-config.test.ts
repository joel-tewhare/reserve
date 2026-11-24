import { describe, expect, it } from 'vitest'
import {
  EXPERIMENT_LIMITS,
  getExperimentConfigErrors,
  projectedTicketDemand,
  validateExperimentConfig,
} from './experiment-config.ts'

describe('experiment config validation', () => {
  it('does not gate admission on inventory scarcity', () => {
    const oversubscribed = {
      userQuantity: 10,
      competingRequests: 150,
      concurrency: 10,
    }
    expect(projectedTicketDemand(10, 150)).toBeGreaterThan(100)
    expect(validateExperimentConfig(oversubscribed)).toBeNull()
    expect(getExperimentConfigErrors(oversubscribed)).toEqual([])
  })

  it('rejects resource-limit violations with specific messages', () => {
    const errors = getExperimentConfigErrors({
      userQuantity: EXPERIMENT_LIMITS.maxUserQuantity + 1,
      competingRequests: EXPERIMENT_LIMITS.maxCompetingRequests + 1,
      concurrency: EXPERIMENT_LIMITS.maxConcurrency + 1,
    })
    expect(errors.length).toBeGreaterThanOrEqual(3)
    expect(errors.some((error) => error.includes('Ticket quantity'))).toBe(true)
    expect(
      errors.some((error) => error.includes('Competing customer requests')),
    ).toBe(true)
    expect(errors.some((error) => error.includes('Concurrency'))).toBe(true)
  })
})

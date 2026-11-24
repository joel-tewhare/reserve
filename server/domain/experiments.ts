import { randomUUID } from 'node:crypto'
import { pool } from '../db/pool.ts'
import { DEMO_EVENT_ID, resetDemoEvent } from '../db/seed.ts'
import { allocateReservation } from './allocation.ts'
import { getEventInventory } from './inventory.ts'
import { reconcileEvent, summariseOutcomes } from './reconcile.ts'
import type {
  ExperimentConfig,
  ExperimentRequestOutcome,
  RequesterKind,
} from './types.ts'

export const EXPERIMENT_LIMITS = {
  maxUserQuantity: 10,
  maxCompetingRequests: 100,
  maxConcurrency: 25,
  maxTotalRequests: 120,
} as const

export function validateExperimentConfig(config: ExperimentConfig): string | null {
  const { userQuantity, competingRequests, concurrency } = config

  if (!Number.isInteger(userQuantity) || userQuantity < 1) {
    return 'userQuantity must be an integer >= 1'
  }
  if (userQuantity > EXPERIMENT_LIMITS.maxUserQuantity) {
    return `userQuantity must be <= ${EXPERIMENT_LIMITS.maxUserQuantity}`
  }
  if (!Number.isInteger(competingRequests) || competingRequests < 0) {
    return 'competingRequests must be an integer >= 0'
  }
  if (competingRequests > EXPERIMENT_LIMITS.maxCompetingRequests) {
    return `competingRequests must be <= ${EXPERIMENT_LIMITS.maxCompetingRequests}`
  }
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    return 'concurrency must be an integer >= 1'
  }
  if (concurrency > EXPERIMENT_LIMITS.maxConcurrency) {
    return `concurrency must be <= ${EXPERIMENT_LIMITS.maxConcurrency}`
  }

  const totalRequests = competingRequests + 1
  if (totalRequests > EXPERIMENT_LIMITS.maxTotalRequests) {
    return `total requests must be <= ${EXPERIMENT_LIMITS.maxTotalRequests}`
  }

  return null
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function runWorker() {
    while (true) {
      const current = nextIndex
      nextIndex += 1
      if (current >= items.length) return
      results[current] = await worker(items[current], current)
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker(),
  )
  await Promise.all(workers)
  return results
}

async function runOneAllocation(
  eventId: string,
  quantity: number,
  kind: RequesterKind,
  experimentRunId: string,
): Promise<ExperimentRequestOutcome> {
  try {
    const outcome = await allocateReservation(
      eventId,
      quantity,
      kind,
      experimentRunId,
    )
    if (outcome.status === 'allocated') {
      return {
        kind,
        status: 'allocated',
        reservationId: outcome.reservationId,
        quantity: outcome.quantity,
      }
    }
    return {
      kind,
      status: 'rejected',
      reason: outcome.reason,
      quantity: outcome.quantity,
      available: outcome.available,
    }
  } catch (error) {
    return {
      kind,
      status: 'error',
      quantity,
      message: error instanceof Error ? error.message : 'Unknown allocation error',
    }
  }
}

export async function runConcurrentReservationExperiment(
  config: ExperimentConfig,
  options: { reset?: boolean; eventId?: string } = {},
) {
  const validationError = validateExperimentConfig(config)
  if (validationError) {
    throw new Error(validationError)
  }

  const eventId = options.eventId ?? DEMO_EVENT_ID
  if (options.reset !== false) {
    await resetDemoEvent()
  }

  const inventoryBefore = await getEventInventory(eventId)
  if (!inventoryBefore) {
    throw new Error(`Event not found: ${eventId}`)
  }

  const experimentRunId = randomUUID()
  await pool.query(
    `
      INSERT INTO experiment_runs
        (id, event_id, user_quantity, competing_requests, concurrency)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      experimentRunId,
      eventId,
      config.userQuantity,
      config.competingRequests,
      config.concurrency,
    ],
  )

  type Job = { kind: RequesterKind; quantity: number }
  const jobs: Job[] = [
    { kind: 'interactive', quantity: config.userQuantity },
    ...Array.from({ length: config.competingRequests }, () => ({
      kind: 'generated' as const,
      quantity: 1,
    })),
  ]

  // Shuffle so the interactive request is not preferentially ordered.
  for (let i = jobs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[jobs[i], jobs[j]] = [jobs[j], jobs[i]]
  }

  const outcomes = await mapPool(jobs, config.concurrency, (job) =>
    runOneAllocation(eventId, job.quantity, job.kind, experimentRunId),
  )

  const personalOutcome =
    outcomes.find((outcome) => outcome.kind === 'interactive') ?? null
  const summary = summariseOutcomes(outcomes)
  const reconciliation = await reconcileEvent(
    eventId,
    summary.allocatedTicketQuantity,
  )
  const inventoryAfter = await getEventInventory(eventId)

  return {
    experimentRunId,
    config,
    inventoryBefore,
    inventoryAfter,
    personalOutcome,
    outcomes,
    summary,
    reconciliation,
    correctness: {
      noOversell: !reconciliation.oversold,
      balances: reconciliation.balances,
      unexpectedErrorCount: summary.unexpectedErrorCount,
    },
  }
}

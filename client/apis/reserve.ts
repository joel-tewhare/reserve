import request from 'superagent'
import type {
  BookingPolicy,
  EventInventory,
  ExperimentResult,
  ExperimentLimits,
} from '../types.ts'

const rootURL = '/api/v1'

export async function fetchDemoEvent(): Promise<EventInventory> {
  const response = await request.get(`${rootURL}/events/demo`)
  return response.body.event as EventInventory
}

export async function resetDemoEvent(): Promise<EventInventory> {
  const response = await request.post(`${rootURL}/events/demo/reset`)
  return response.body.event as EventInventory
}

export async function fetchExperimentLimits(): Promise<ExperimentLimits> {
  const response = await request.get(`${rootURL}/experiments/limits`)
  return response.body.limits as ExperimentLimits
}

export async function runExperiment(input: {
  userQuantity: number
  competingRequests: number
  concurrency: number
  bookingPolicy: BookingPolicy
  reset?: boolean
}): Promise<ExperimentResult> {
  const response = await request.post(`${rootURL}/experiments/runs`).send(input)
  return response.body as ExperimentResult
}

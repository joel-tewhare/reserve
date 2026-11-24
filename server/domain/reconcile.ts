import { getEventInventory } from './inventory.ts'
import type { ExperimentRequestOutcome, Reconciliation } from './types.ts'

export function summariseOutcomes(outcomes: ExperimentRequestOutcome[]) {
  const allocated = outcomes.filter((o) => o.status === 'allocated')
  const rejectedAvailability = outcomes.filter(
    (o) => o.status === 'rejected' && o.reason === 'insufficient_inventory',
  )
  const rejectedInvalid = outcomes.filter(
    (o) => o.status === 'rejected' && o.reason === 'invalid_quantity',
  )
  const errors = outcomes.filter((o) => o.status === 'error')

  return {
    requestCount: outcomes.length,
    successfulReservationCount: allocated.length,
    allocatedTicketQuantity: allocated.reduce((sum, o) => sum + o.quantity, 0),
    availabilityRejectionCount: rejectedAvailability.length,
    invalidQuantityRejectionCount: rejectedInvalid.length,
    unexpectedErrorCount: errors.length,
  }
}

export async function reconcileEvent(
  eventId: string,
  reportedAllocatedTickets: number,
): Promise<Reconciliation> {
  const inventory = await getEventInventory(eventId)
  if (!inventory) {
    throw new Error(`Event not found during reconciliation: ${eventId}`)
  }

  const expectedRemaining = inventory.capacity - reportedAllocatedTickets
  const oversold = inventory.allocatedTickets > inventory.capacity
  const balances =
    inventory.allocatedTickets === reportedAllocatedTickets &&
    inventory.availableTickets === expectedRemaining &&
    !oversold

  return {
    capacity: inventory.capacity,
    successfulReservationCount: inventory.successfulReservationCount,
    allocatedTicketQuantity: inventory.allocatedTickets,
    remainingInventory: inventory.availableTickets,
    expectedRemaining,
    balances,
    oversold,
  }
}

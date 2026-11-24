export type RequesterKind = 'interactive' | 'generated'

export type AllocationOutcome =
  | {
      status: 'allocated'
      reservationId: string
      eventId: string
      quantity: number
      requesterKind: RequesterKind
    }
  | {
      status: 'rejected'
      reason: 'insufficient_inventory' | 'invalid_quantity'
      eventId: string
      quantity: number
      requesterKind: RequesterKind
      available: number
    }

export type EventInventory = {
  id: string
  name: string
  capacity: number
  allocatedTickets: number
  availableTickets: number
  successfulReservationCount: number
}

export type ExperimentConfig = {
  userQuantity: number
  competingRequests: number
  concurrency: number
}

export type ExperimentRequestOutcome =
  | {
      kind: RequesterKind
      status: 'allocated'
      reservationId: string
      quantity: number
    }
  | {
      kind: RequesterKind
      status: 'rejected'
      reason: 'insufficient_inventory' | 'invalid_quantity'
      quantity: number
      available: number
    }
  | {
      kind: RequesterKind
      status: 'error'
      quantity: number
      message: string
    }

export type Reconciliation = {
  capacity: number
  successfulReservationCount: number
  allocatedTicketQuantity: number
  remainingInventory: number
  expectedRemaining: number
  balances: boolean
  oversold: boolean
}

export type EventInventory = {
  id: string
  name: string
  capacity: number
  allocatedTickets: number
  availableTickets: number
  successfulReservationCount: number
}

export type ExperimentLimits = {
  maxUserQuantity: number
  maxCompetingRequests: number
  maxConcurrency: number
  maxTotalRequests: number
}

export type PersonalOutcome =
  | {
      kind: 'interactive'
      status: 'allocated'
      reservationId: string
      quantity: number
    }
  | {
      kind: 'interactive'
      status: 'rejected'
      reason: 'insufficient_inventory' | 'invalid_quantity'
      quantity: number
      available: number
    }
  | {
      kind: 'interactive'
      status: 'error'
      quantity: number
      message: string
    }

export type ExperimentResult = {
  experimentRunId: string
  config: {
    userQuantity: number
    competingRequests: number
    concurrency: number
  }
  inventoryBefore: EventInventory
  inventoryAfter: EventInventory | null
  personalOutcome: PersonalOutcome | null
  summary: {
    requestCount: number
    successfulReservationCount: number
    allocatedTicketQuantity: number
    availabilityRejectionCount: number
    invalidQuantityRejectionCount: number
    unexpectedErrorCount: number
  }
  reconciliation: {
    capacity: number
    successfulReservationCount: number
    allocatedTicketQuantity: number
    remainingInventory: number
    expectedRemaining: number
    balances: boolean
    oversold: boolean
  }
  correctness: {
    noOversell: boolean
    balances: boolean
    unexpectedErrorCount: number
  }
}

export type ConsolePhase =
  | 'loading'
  | 'ready'
  | 'confirming'
  | 'personal'
  | 'evidence'
  | 'error'
  | 'uncertain'

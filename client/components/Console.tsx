import { useEffect, useMemo, useState } from 'react'
import {
  fetchDemoEvent,
  fetchExperimentLimits,
  resetDemoEvent,
  runExperiment,
} from '../apis/reserve.ts'
import type {
  ConsolePhase,
  EventInventory,
  ExperimentLimits,
  ExperimentResult,
} from '../types.ts'

const DEFAULT_LIMITS: ExperimentLimits = {
  maxUserQuantity: 10,
  maxCompetingRequests: 100,
  maxConcurrency: 25,
  maxTotalRequests: 120,
}

export default function Console() {
  const [phase, setPhase] = useState<ConsolePhase>('loading')
  const [event, setEvent] = useState<EventInventory | null>(null)
  const [limits, setLimits] = useState<ExperimentLimits>(DEFAULT_LIMITS)
  const [userQuantity, setUserQuantity] = useState(1)
  const [competingRequests, setCompetingRequests] = useState(20)
  const [concurrency, setConcurrency] = useState(10)
  const [result, setResult] = useState<ExperimentResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [demoEvent, experimentLimits] = await Promise.all([
          fetchDemoEvent(),
          fetchExperimentLimits(),
        ])
        if (cancelled) return
        setEvent(demoEvent)
        setLimits(experimentLimits)
        setPhase('ready')
      } catch {
        if (cancelled) return
        setErrorMessage(
          'Could not load the demo event. Is PostgreSQL running and the API up?',
        )
        setPhase('error')
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const totalRequests = competingRequests + 1
  const configValid = useMemo(() => {
    return (
      userQuantity >= 1 &&
      userQuantity <= limits.maxUserQuantity &&
      competingRequests >= 0 &&
      competingRequests <= limits.maxCompetingRequests &&
      concurrency >= 1 &&
      concurrency <= limits.maxConcurrency &&
      totalRequests <= limits.maxTotalRequests
    )
  }, [userQuantity, competingRequests, concurrency, limits, totalRequests])

  async function handleReset() {
    setErrorMessage(null)
    setResult(null)
    try {
      const demoEvent = await resetDemoEvent()
      setEvent(demoEvent)
      setPhase('ready')
    } catch {
      setErrorMessage('Reset failed. The database state is uncertain from this client.')
      setPhase('uncertain')
    }
  }

  async function handleConfirm() {
    if (!configValid || !event) return

    setPhase('confirming')
    setErrorMessage(null)
    setResult(null)

    try {
      const experimentResult = await runExperiment({
        userQuantity,
        competingRequests,
        concurrency,
        reset: true,
      })
      setResult(experimentResult)
      setEvent(experimentResult.inventoryAfter)
      setPhase('personal')
    } catch (error) {
      // Transport / unexpected client failure: do not claim allocation failed.
      const message =
        error instanceof Error
          ? error.message
          : 'The reservation request did not return a usable response.'
      setErrorMessage(message)
      setPhase('uncertain')
      try {
        const latest = await fetchDemoEvent()
        setEvent(latest)
      } catch {
        // Keep prior event projection if refresh also fails.
      }
    }
  }

  return (
    <div className="console">
      <header className="console__header">
        <p className="console__eyebrow">Reserve Engineering Console</p>
        <h1>Reserve under demand</h1>
        <p className="console__lede">
          Select tickets for a demonstration event, set competing demand, then
          confirm. Your request competes as a genuine reservation against the
          same PostgreSQL inventory — without preferential treatment.
        </p>
      </header>

      <section className="stage" aria-labelledby="stage-event">
        <h2 id="stage-event">1. Event and inventory</h2>
        {phase === 'loading' && <p className="muted">Loading authoritative inventory…</p>}
        {event && (
          <dl className="stat-grid">
            <div>
              <dt>Event</dt>
              <dd>{event.name}</dd>
            </div>
            <div>
              <dt>Capacity</dt>
              <dd>{event.capacity}</dd>
            </div>
            <div>
              <dt>Allocated tickets</dt>
              <dd>{event.allocatedTickets}</dd>
            </div>
            <div>
              <dt>Available</dt>
              <dd>{event.availableTickets}</dd>
            </div>
            <div>
              <dt>Successful reservations</dt>
              <dd>{event.successfulReservationCount}</dd>
            </div>
          </dl>
        )}
        <button type="button" className="button button--ghost" onClick={handleReset}>
          Reset to known initial conditions
        </button>
      </section>

      <section className="stage" aria-labelledby="stage-demand">
        <h2 id="stage-demand">2. Your reservation and demand conditions</h2>
        <div className="controls">
          <label>
            Ticket quantity
            <input
              type="number"
              min={1}
              max={limits.maxUserQuantity}
              value={userQuantity}
              onChange={(e) => setUserQuantity(Number(e.target.value))}
            />
          </label>
          <label>
            Competing customer requests
            <input
              type="number"
              min={0}
              max={limits.maxCompetingRequests}
              value={competingRequests}
              onChange={(e) => setCompetingRequests(Number(e.target.value))}
            />
          </label>
          <label>
            Concurrency
            <input
              type="number"
              min={1}
              max={limits.maxConcurrency}
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="callout">
          <p>
            Before confirmation: {event?.availableTickets ?? '—'} tickets available.
            Your request for <strong>{userQuantity}</strong> ticket
            {userQuantity === 1 ? '' : 's'} will compete with{' '}
            <strong>{competingRequests}</strong> generated one-ticket requests
            (total <strong>{totalRequests}</strong>) at concurrency{' '}
            <strong>{concurrency}</strong>.
          </p>
          <p className="muted">
            Allocation is all-or-nothing. A personal rejection can be a correct
            system outcome under demand.
          </p>
          {!configValid && (
            <p className="warn">
              Configuration exceeds constrained experiment limits and cannot run.
            </p>
          )}
        </div>

        <button
          type="button"
          className="button"
          disabled={!configValid || phase === 'loading' || phase === 'confirming'}
          onClick={handleConfirm}
        >
          {phase === 'confirming' ? 'Competing for inventory…' : 'Confirm reservation'}
        </button>
      </section>

      <section className="stage" aria-labelledby="stage-personal">
        <h2 id="stage-personal">3. Your reservation outcome</h2>
        {phase === 'confirming' && (
          <p className="muted">Running genuine competing reservation requests…</p>
        )}
        {phase === 'uncertain' && (
          <div className="callout callout--uncertain">
            <p>
              The client did not receive a usable authoritative response. This is
              an <strong>uncertain outcome</strong>, not proof that allocation
              failed. A transaction may have committed before the response was lost.
            </p>
            {errorMessage && <p className="muted">{errorMessage}</p>}
          </div>
        )}
        {phase === 'error' && (
          <div className="callout callout--error">
            <p>{errorMessage ?? 'Unexpected console error.'}</p>
          </div>
        )}
        {result?.personalOutcome && (
          <PersonalOutcomeCard outcome={result.personalOutcome} />
        )}
        {result && (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setPhase('evidence')}
          >
            Reveal wider outcomes and evidence
          </button>
        )}
      </section>

      {(phase === 'evidence' || phase === 'personal') && result && (
        <section className="stage" aria-labelledby="stage-evidence">
          <h2 id="stage-evidence">4–5. Wider outcomes and engineering evidence</h2>
          <dl className="stat-grid">
            <div>
              <dt>Requests</dt>
              <dd>{result.summary.requestCount}</dd>
            </div>
            <div>
              <dt>Successful reservations</dt>
              <dd>{result.summary.successfulReservationCount}</dd>
            </div>
            <div>
              <dt>Allocated tickets</dt>
              <dd>{result.summary.allocatedTicketQuantity}</dd>
            </div>
            <div>
              <dt>Availability rejections</dt>
              <dd>{result.summary.availabilityRejectionCount}</dd>
            </div>
            <div>
              <dt>Unexpected errors</dt>
              <dd>{result.summary.unexpectedErrorCount}</dd>
            </div>
            <div>
              <dt>Remaining inventory (DB)</dt>
              <dd>{result.reconciliation.remainingInventory}</dd>
            </div>
          </dl>

          <div
            className={
              result.correctness.balances && result.correctness.noOversell
                ? 'callout callout--ok'
                : 'callout callout--error'
            }
          >
            <p>
              Reconciliation{' '}
              {result.correctness.balances ? 'balances' : 'does not balance'} with
              PostgreSQL. Oversell:{' '}
              {result.correctness.noOversell ? 'none detected' : 'detected'}.
            </p>
            <p className="muted mono">
              run {result.experimentRunId} · success count{' '}
              {result.reconciliation.successfulReservationCount} · tickets{' '}
              {result.reconciliation.allocatedTicketQuantity} · remaining{' '}
              {result.reconciliation.remainingInventory}
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

function PersonalOutcomeCard({
  outcome,
}: {
  outcome: NonNullable<ExperimentResult['personalOutcome']>
}) {
  if (outcome.status === 'allocated') {
    return (
      <div className="callout callout--ok">
        <p>
          Allocated <strong>{outcome.quantity}</strong> ticket
          {outcome.quantity === 1 ? '' : 's'}.
        </p>
        <p className="muted mono">reservation {outcome.reservationId}</p>
      </div>
    )
  }

  if (outcome.status === 'rejected') {
    return (
      <div className="callout">
        <p>
          Authoritative rejection
          {outcome.reason === 'insufficient_inventory'
            ? ' for availability'
            : ' for invalid quantity'}
          . No inventory was allocated to this request.
        </p>
        <p className="muted">
          Requested {outcome.quantity}; available at decision time:{' '}
          {outcome.available}. A personal rejection can be entirely correct under
          concurrent demand.
        </p>
      </div>
    )
  }

  return (
    <div className="callout callout--error">
      <p>Unexpected allocation error for your request: {outcome.message}</p>
    </div>
  )
}

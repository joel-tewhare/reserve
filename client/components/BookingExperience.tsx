import { useEffect, useMemo, useState } from 'react'
import {
  EXPERIMENT_LIMITS,
  getExperimentConfigErrors,
  projectedTicketDemand,
} from '../../shared/experiment-config.ts'
import {
  fetchDemoEvent,
  fetchExperimentLimits,
  resetDemoEvent,
  runExperiment,
} from '../apis/reserve.ts'
import type {
  BookingPolicy,
  EventInventory,
  ExperimentLimits,
  ExperimentResult,
  PersonalOutcome,
} from '../types.ts'

const DEFAULT_LIMITS: ExperimentLimits = { ...EXPERIMENT_LIMITS }

type JourneyStage = 'event' | 'conditions' | 'outcome'
type LoadState = 'loading' | 'ready' | 'error'

export default function BookingExperience() {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [stage, setStage] = useState<JourneyStage>('event')
  const [event, setEvent] = useState<EventInventory | null>(null)
  const [limits, setLimits] = useState<ExperimentLimits>(DEFAULT_LIMITS)
  const [userQuantity, setUserQuantity] = useState(1)
  const [competingRequests, setCompetingRequests] = useState(20)
  const [concurrency, setConcurrency] = useState(10)
  const [vipEnabled, setVipEnabled] = useState(false)
  const [completedRun, setCompletedRun] = useState<ExperimentResult | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [confirmUncertain, setConfirmUncertain] = useState(false)
  const [restartError, setRestartError] = useState<string | null>(null)

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
        setLoadState('ready')
      } catch {
        if (cancelled) return
        setLoadError(
          'We could not load ticket availability. Check that Reserve’s API and PostgreSQL are running.',
        )
        setLoadState('error')
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const ticketDemand = projectedTicketDemand(userQuantity, competingRequests)
  const configErrors = useMemo(
    () =>
      getExperimentConfigErrors({
        userQuantity,
        competingRequests,
        concurrency,
      }),
    [userQuantity, competingRequests, concurrency],
  )
  const configValid = configErrors.length === 0
  const oversubscribed = event != null && ticketDemand > event.availableTickets
  const busy = confirming || restarting

  async function handleConfirm() {
    if (!configValid || !event || busy) return

    setConfirming(true)
    setConfirmError(null)
    setConfirmUncertain(false)
    setRestartError(null)

    try {
      const bookingPolicy: BookingPolicy = vipEnabled ? 'vip' : 'standard'
      const experimentResult = await runExperiment({
        userQuantity,
        competingRequests,
        concurrency,
        bookingPolicy,
        reset: true,
      })
      setCompletedRun(experimentResult)
      if (experimentResult.inventoryAfter) {
        setEvent(experimentResult.inventoryAfter)
      }
      setStage('outcome')
    } catch (error) {
      setConfirmUncertain(true)
      setConfirmError(
        error instanceof Error
          ? error.message
          : 'The booking request did not return a usable response.',
      )
      setStage('outcome')
      setCompletedRun(null)
      try {
        const latest = await fetchDemoEvent()
        setEvent(latest)
      } catch {
        // Keep current inventory projection if refresh fails.
      }
    } finally {
      setConfirming(false)
    }
  }

  async function handleStartAnother() {
    if (busy) return

    setRestarting(true)
    setRestartError(null)

    try {
      const demoEvent = await resetDemoEvent()
      setEvent(demoEvent)
      setCompletedRun(null)
      setConfirmError(null)
      setConfirmUncertain(false)
      setUserQuantity(1)
      setCompetingRequests(20)
      setConcurrency(10)
      setVipEnabled(false)
      setStage('event')
    } catch {
      setRestartError(
        'Could not reset demonstration conditions. Your completed booking outcome is still shown; try again when ready.',
      )
    } finally {
      setRestarting(false)
    }
  }

  return (
    <div className="booking">
      <ProgressIndicator stage={stage} />

      {loadState === 'loading' && (
        <p className="muted booking__status">Loading your booking experience…</p>
      )}

      {loadState === 'error' && (
        <div className="panel callout callout--error">
          <p>{loadError}</p>
        </div>
      )}

      {loadState === 'ready' && stage === 'event' && event && (
        <StageEvent
          event={event}
          onSelect={() => {
            if (busy) return
            setStage('conditions')
          }}
        />
      )}

      {loadState === 'ready' && stage === 'conditions' && event && (
        <StageConditions
          event={event}
          limits={limits}
          userQuantity={userQuantity}
          competingRequests={competingRequests}
          concurrency={concurrency}
          vipEnabled={vipEnabled}
          ticketDemand={ticketDemand}
          oversubscribed={oversubscribed}
          configValid={configValid}
          configErrors={configErrors}
          confirming={confirming}
          onUserQuantity={setUserQuantity}
          onCompetingRequests={setCompetingRequests}
          onConcurrency={setConcurrency}
          onVipEnabled={setVipEnabled}
          onBack={() => {
            if (busy) return
            setStage('event')
          }}
          onConfirm={handleConfirm}
        />
      )}

      {loadState === 'ready' && stage === 'outcome' && (
        <StageOutcome
          completedRun={completedRun}
          confirmUncertain={confirmUncertain}
          confirmError={confirmError}
          restarting={restarting}
          restartError={restartError}
          onStartAnother={handleStartAnother}
        />
      )}
    </div>
  )
}

function ProgressIndicator({ stage }: { stage: JourneyStage }) {
  const steps: { id: JourneyStage; label: string }[] = [
    { id: 'event', label: 'Choose event' },
    { id: 'conditions', label: 'Booking conditions' },
    { id: 'outcome', label: 'Your outcome' },
  ]
  const activeIndex = steps.findIndex((step) => step.id === stage)

  return (
    <nav className="progress" aria-label="Booking progress">
      <ol>
        {steps.map((step, index) => {
          const state =
            index < activeIndex ? 'done' : index === activeIndex ? 'current' : 'todo'
          return (
            <li key={step.id} className={`progress__step progress__step--${state}`}>
              <span className="progress__index">{index + 1}</span>
              <span className="progress__label">{step.label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function StageEvent({
  event,
  onSelect,
}: {
  event: EventInventory
  onSelect: () => void
}) {
  return (
    <section className="panel panel--hero">
      <p className="eyebrow">This is RESERVE.</p>
      <h1>Your ticket booking experience.</h1>
      <p className="lede">
        See what happens when many people try to book tickets for the same event
        at once. Choose an event to begin — your booking will compete for real
        limited inventory.
      </p>

      <button type="button" className="event-card" onClick={onSelect}>
        <div className="event-card__body">
          <h2>{event.name}</h2>
          <p className="muted">Demonstration event · finite ticket inventory</p>
        </div>
        <div className="event-card__availability">
          <span className="event-card__count">{event.availableTickets}</span>
          <span className="event-card__caption">tickets available</span>
        </div>
      </button>
    </section>
  )
}

function StageConditions({
  event,
  limits,
  userQuantity,
  competingRequests,
  concurrency,
  vipEnabled,
  ticketDemand,
  oversubscribed,
  configValid,
  configErrors,
  confirming,
  onUserQuantity,
  onCompetingRequests,
  onConcurrency,
  onVipEnabled,
  onBack,
  onConfirm,
}: {
  event: EventInventory
  limits: ExperimentLimits
  userQuantity: number
  competingRequests: number
  concurrency: number
  vipEnabled: boolean
  ticketDemand: number
  oversubscribed: boolean
  configValid: boolean
  configErrors: string[]
  confirming: boolean
  onUserQuantity: (value: number) => void
  onCompetingRequests: (value: number) => void
  onConcurrency: (value: number) => void
  onVipEnabled: (value: boolean) => void
  onBack: () => void
  onConfirm: () => void
}) {
  return (
    <section className="panel">
      <header className="panel__header panel__header--with-vip">
        <div>
          <p className="eyebrow">{event.name}</p>
          <h1>Set your booking conditions</h1>
          <p className="lede">
            {event.availableTickets} ticket
            {event.availableTickets === 1 ? '' : 's'} available right now.
          </p>
        </div>
        <label className={`vip-toggle${confirming ? ' vip-toggle--disabled' : ''}`}>
          <span className="vip-toggle__text">
            <strong>VIP</strong>
            <span className="muted">Enable VIP to get priority access to tickets.</span>
          </span>
          <input
            type="checkbox"
            checked={vipEnabled}
            disabled={confirming}
            onChange={(e) => onVipEnabled(e.target.checked)}
          />
        </label>
      </header>

      <div className="form-stack">
        <fieldset className="form-block" disabled={confirming}>
          <legend>How many tickets do you want to buy?</legend>
          <p className="muted">Choose between 1 and {limits.maxUserQuantity} tickets.</p>
          <input
            type="number"
            min={1}
            max={limits.maxUserQuantity}
            value={userQuantity}
            onChange={(e) => onUserQuantity(Number(e.target.value))}
          />
        </fieldset>

        <fieldset className="form-block" disabled={confirming}>
          <legend>How many people do you want to compete with?</legend>
          <p className="muted">
            Up to {limits.maxCompetingRequests} other people, each trying to secure
            one ticket.
          </p>
          <input
            type="number"
            min={0}
            max={limits.maxCompetingRequests}
            value={competingRequests}
            onChange={(e) => onCompetingRequests(Number(e.target.value))}
          />
        </fieldset>

        <fieldset className="form-block" disabled={confirming}>
          <legend>Concurrency</legend>
          <p className="muted">
            How many booking requests can be processed at the same time? Choose
            between 1 and {limits.maxConcurrency}.
          </p>
          <input
            type="number"
            min={1}
            max={limits.maxConcurrency}
            value={concurrency}
            onChange={(e) => onConcurrency(Number(e.target.value))}
          />
        </fieldset>
      </div>

      <div className="summary">
        <p>
          You are asking for <strong>{userQuantity}</strong> ticket
          {userQuantity === 1 ? '' : 's'} while <strong>{competingRequests}</strong>{' '}
          other {competingRequests === 1 ? 'person tries' : 'people try'} for one
          each — <strong>{ticketDemand}</strong> tickets demanded against{' '}
          <strong>{event.availableTickets}</strong> available, with concurrency{' '}
          <strong>{concurrency}</strong>
          {vipEnabled
            ? '. VIP is on: your booking gets first access before others compete.'
            : '. Standard booking: you compete alongside everyone else.'}
        </p>
        {oversubscribed && configValid && (
          <p>
            That is more demand than tickets. Not everyone will get tickets — and
            that is a valid booking condition here
            {vipEnabled ? ', even with VIP priority' : ''}.
          </p>
        )}
        {!configValid && (
          <ul className="warn-list">
            {configErrors.map((error) => (
              <li key={error} className="warn">
                {error}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="actions">
        <button
          type="button"
          className="button button--ghost"
          onClick={onBack}
          disabled={confirming}
        >
          Back
        </button>
        <button
          type="button"
          className="button"
          onClick={onConfirm}
          disabled={!configValid || confirming}
        >
          {confirming ? 'Confirming booking…' : 'Confirm booking'}
        </button>
      </div>
    </section>
  )
}

function StageOutcome({
  completedRun,
  confirmUncertain,
  confirmError,
  restarting,
  restartError,
  onStartAnother,
}: {
  completedRun: ExperimentResult | null
  confirmUncertain: boolean
  confirmError: string | null
  restarting: boolean
  restartError: string | null
  onStartAnother: () => void
}) {
  const eventName =
    completedRun?.inventoryBefore.name ?? 'the Reserve Engineering Summit'
  const missedOutCount =
    (completedRun?.summary.availabilityRejectionCount ?? 0) +
    (completedRun?.summary.invalidQuantityRejectionCount ?? 0)

  return (
    <section className="panel">
      <header className="panel__header">
        <p className="eyebrow">Booking complete</p>
        <h1>Discover your outcome</h1>
      </header>

      {confirmUncertain && (
        <div className="callout callout--uncertain">
          <p>
            We did not receive a usable booking response. This is an{' '}
            <strong>uncertain outcome</strong> — not proof that tickets were or
            were not allocated. A reservation may have committed before the reply
            was lost.
          </p>
          {confirmError && <p className="muted">{confirmError}</p>}
        </div>
      )}

      {!confirmUncertain && completedRun && (
        <>
          <PersonalOutcome
            outcome={completedRun.personalOutcome}
            eventName={eventName}
            bookingPolicy={completedRun.config.bookingPolicy}
          />

          <div className="outcome-block">
            <h2>What happened to everyone else?</h2>
            {completedRun.config.bookingPolicy === 'vip' && (
              <p className="muted">
                This run used VIP priority: your booking was attempted before
                competing requests were admitted.
              </p>
            )}
            <dl className="result-grid">
              <ResultStat
                label="People trying to book"
                value={completedRun.summary.requestCount}
              />
              <ResultStat
                label="People who secured tickets"
                value={completedRun.summary.successfulReservationCount}
              />
              <ResultStat label="People who missed out" value={missedOutCount} />
              <ResultStat
                label="Tickets allocated"
                value={completedRun.summary.allocatedTicketQuantity}
              />
              <ResultStat
                label="Tickets remaining"
                value={completedRun.reconciliation.remainingInventory}
              />
              {completedRun.summary.unexpectedErrorCount > 0 && (
                <ResultStat
                  label="Unexpected errors"
                  value={completedRun.summary.unexpectedErrorCount}
                  warn
                />
              )}
            </dl>
            <p className="muted">
              “People who secured tickets” counts successful bookings.
              “Tickets allocated” counts seats taken — they are different numbers
              when some bookings are for more than one ticket.
            </p>
          </div>

          <details className="evidence">
            <summary>Explore the engineering behind your booking</summary>
            <EngineeringEvidence run={completedRun} />
          </details>
        </>
      )}

      {!confirmUncertain && !completedRun && (
        <div className="callout callout--error">
          <p>No completed booking result is available to show.</p>
        </div>
      )}

      {restartError && (
        <div className="callout callout--uncertain">
          <p>{restartError}</p>
        </div>
      )}

      <div className="actions">
        <button
          type="button"
          className="button"
          onClick={onStartAnother}
          disabled={restarting}
        >
          {restarting ? 'Preparing another experience…' : 'Start another experience'}
        </button>
      </div>
    </section>
  )
}

function PersonalOutcome({
  outcome,
  eventName,
  bookingPolicy,
}: {
  outcome: PersonalOutcome | null
  eventName: string
  bookingPolicy: BookingPolicy
}) {
  const vipNote =
    bookingPolicy === 'vip' ? (
      <p className="muted">VIP priority was applied for this booking.</p>
    ) : null

  if (!outcome) {
    return (
      <div className="callout">
        <p>Your personal booking result is unavailable for this run.</p>
        {vipNote}
      </div>
    )
  }

  if (outcome.status === 'allocated') {
    return (
      <div className="callout callout--ok outcome-hero">
        <h2>You&apos;re going!</h2>
        <p>
          You successfully secured {outcome.quantity} ticket
          {outcome.quantity === 1 ? '' : 's'} to {eventName}.
        </p>
        {vipNote}
      </div>
    )
  }

  if (outcome.status === 'rejected') {
    return (
      <div className="callout outcome-hero">
        <h2>You missed out this time.</h2>
        <p>
          {outcome.reason === 'insufficient_inventory'
            ? bookingPolicy === 'vip'
              ? 'Even with VIP priority, there weren’t enough tickets remaining to fulfil your booking. No tickets were allocated to you.'
              : 'There weren’t enough tickets remaining to fulfil your booking. No tickets were allocated to you.'
            : 'Your booking could not be fulfilled because the ticket quantity was not valid. No tickets were allocated to you.'}
        </p>
        {vipNote}
      </div>
    )
  }

  return (
    <div className="callout callout--error outcome-hero">
      <h2>Something unexpected happened</h2>
      <p>
        Your booking hit an unexpected error, which is different from simply
        missing out on tickets. {outcome.message}
      </p>
    </div>
  )
}

function ResultStat({
  label,
  value,
  warn = false,
}: {
  label: string
  value: number
  warn?: boolean
}) {
  return (
    <div className={`result-stat${warn ? ' result-stat--warn' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function EngineeringEvidence({ run }: { run: ExperimentResult }) {
  const guaranteesHeld = run.correctness.balances && run.correctness.noOversell

  return (
    <div className="evidence__body">
      <p>
        These figures come from the completed experiment run, including conditions
        recorded when it started — not from the form you might edit next time.
      </p>
      <dl className="stat-grid">
        <div>
          <dt>Experiment run</dt>
          <dd className="mono">{run.experimentRunId}</dd>
        </div>
        <div>
          <dt>Your ticket quantity (this run)</dt>
          <dd>{run.config.userQuantity}</dd>
        </div>
        <div>
          <dt>Competing requests (this run)</dt>
          <dd>{run.config.competingRequests}</dd>
        </div>
        <div>
          <dt>Concurrency (this run)</dt>
          <dd>{run.config.concurrency}</dd>
        </div>
        <div>
          <dt>Booking policy (this run)</dt>
          <dd>{run.config.bookingPolicy === 'vip' ? 'vip (VIP-first)' : 'standard'}</dd>
        </div>
        <div>
          <dt>Available before this run</dt>
          <dd>{run.inventoryBefore.availableTickets}</dd>
        </div>
        <div>
          <dt>Successful reservations</dt>
          <dd>{run.reconciliation.successfulReservationCount}</dd>
        </div>
        <div>
          <dt>Tickets allocated</dt>
          <dd>{run.reconciliation.allocatedTicketQuantity}</dd>
        </div>
        <div>
          <dt>Tickets remaining (reconciled)</dt>
          <dd>{run.reconciliation.remainingInventory}</dd>
        </div>
        <div>
          <dt>Availability rejections</dt>
          <dd>{run.summary.availabilityRejectionCount}</dd>
        </div>
        <div>
          <dt>Unexpected errors</dt>
          <dd>{run.summary.unexpectedErrorCount}</dd>
        </div>
        {run.personalOutcome?.status === 'allocated' && (
          <div>
            <dt>Your reservation id</dt>
            <dd className="mono">{run.personalOutcome.reservationId}</dd>
          </div>
        )}
      </dl>
      <div className={guaranteesHeld ? 'callout callout--ok' : 'callout callout--error'}>
        <p>
          {guaranteesHeld
            ? 'Engineering guarantees held for this run: reconciliation balances and no oversell was detected — whether or not you personally secured tickets.'
            : 'Engineering guarantees did not hold for this run: check reconciliation and oversell detection below.'}
        </p>
        <p className="muted mono">
          balances={String(run.correctness.balances)} · noOversell=
          {String(run.correctness.noOversell)} · capacity={run.reconciliation.capacity}
        </p>
      </div>
    </div>
  )
}

Work: booking-experience
Status: accepted
Related: docs/briefs/booking-experience.md, docs/architecture/system-model.md, docs/briefs/reserve.md
Supersedes: none

Four-pass calibration for this UI/product presentation evolution. Not a universal law.

Clarifications (accepted with plan): historical conditions/outcomes come from the completed `ExperimentResult` (and other authoritative run data), not from later inventory refreshes or mutable form inputs; confirm and restart use in-progress states that block repeat submission; Start another experience clears the completed outcome and returns to stage 1 only after successful authoritative reset.

## Objective

Replace the stacked Engineering Console presentation with a three-stage ticket booking journey that uses the existing reservation and experiment APIs unchanged in behaviour.

## Governing capabilities

From `docs/architecture/system-model.md`:

- Event inventory
- Reservation allocation
- Concurrent demand experience
- Outcome inspection

## Scope

In:

- Stage 1: Reserve intro + clickable demo event card showing available tickets
- Stage 2: Three vertical condition sections (tickets, competitors, concurrency), demand summary, validation messages, Back / Confirm booking
- Stage 3: Approachable personal outcome, wider booking results, optional expandable engineering evidence, Start another experience (authoritative reset then return to stage 1)
- Progress indication across three distinct stages (not simultaneous stacks)
- Preserve association of outcome/evidence with the completed experiment run
- Client presentation/state/navigation only, reusing existing APIs and shared experiment limits

Out:

- Backend allocation/experiment semantics changes
- Priority/guaranteed booking
- Holds, payments, messaging, AWS
- In-journey tutorials/diagrams beyond short concurrency copy
- Silent inventory reset on ordinary Back/navigation

## Preserve

- PostgreSQL authority; transactional all-or-nothing allocation; genuine competing requests; no preferential interactive treatment
- Oversubscription allowed; resource limits from `shared/experiment-config.ts`
- Transport/uncertain ≠ authoritative rejection
- Evidence genuine and reconcilable; no synthetic results
- Explicit reset only when starting another experience

## External seams not crossed

No new external providers, secrets, or cloud side effects.

## Pass 1 — UI / structure

Primary: three-stage shell with progress indicator; stage layouts and copy scaffolding; event card; condition form sections; outcome/wider/evidence structure (evidence collapsed); Back / Confirm / Start another experience controls; loading/success/missed-out/error/uncertain visual states. Placeholder/local stage state only. Do not change API contracts.

## Pass 2 — Data / state

Primary: wire stages to existing `fetchDemoEvent`, `fetchExperimentLimits`, `runExperiment`, `resetDemoEvent`; hold current inventory, proposed conditions, completed `ExperimentResult` separately; stage navigation state; ensure Back does not reset; Start another experience calls reset then clears completed result and returns to stage 1; loading/error/uncertain wiring for confirm and reset.

## Pass 3 — Derived behaviour / logic

Primary: shared validation via existing helpers; demand-vs-inventory summary and oversubscription messaging; personal/wider outcome presentation derived from authoritative result fields; engineering evidence content only from completed run; disable Confirm when invalid; keep outcome stage bound to that run’s result.

## Pass 4 — Polish / coherence

Primary: typography/spacing/hierarchy, responsive behaviour, progressive disclosure quality, clear primary actions, accessibility of expand/collapse and progress, copy coherence. No new product behaviour.

## Acceptance

- Visitor completes stages 1→2→3 through the booking journey using genuine experiments
- Personal “going” / “missed out” language for authoritative success/rejection; errors and uncertain outcomes distinct
- Wider results use approachable labels while keeping counts vs ticket quantities distinct
- Engineering evidence optional, expandable, and tied to the completed run
- Start another experience resets via existing API; Back does not
- Existing allocation tests remain green; typecheck passes

## Proof

- `npm test`
- `npm run typecheck`
- Human walkthrough of the three stages, including oversubscribed confirm and Start another experience

## Stop / return

Stop if presentation work would require preferential booking, synthetic evidence, silent resets, inventory-gated experiment admission, or new backend capabilities beyond existing APIs.

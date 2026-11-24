Work: booking-experience
Status: complete
Related: docs/plans/booking-experience.md, docs/architecture/system-model.md
Supersedes: none

## Shipped

- Three-stage booking journey: choose event → booking conditions → discover outcome
- Progress indicator; Back without silent reset; Start another experience only clears outcome after successful authoritative reset
- Confirm/restart in-progress guards against repeat submission
- Historical conditions and evidence bound to completed `ExperimentResult` (`config`, `inventoryBefore`, reconciliation), not mutable form inputs
- Approachable personal/wider outcome copy; optional expandable engineering evidence
- Replaced stacked Engineering Console presentation (`BookingExperience` replaces `Console`)

## Not touched

- Allocation/experiment backend semantics
- Priority booking, holds, payments, messaging, AWS

## Invariants

Preserved per living system model, including explicit reset and outcome/run association.

## Deviations

None material. Continuous four-pass implement; history captured here.

## Proof

- `npm test`
- `npm run typecheck`
- Human walkthrough of stages expected after closeout

## Remaining limitations

- Uncertain outcomes still have no recovery product
- Single demonstration event only

## Architecture

System model framing already updated for booking presentation; no further consequential architectural change.

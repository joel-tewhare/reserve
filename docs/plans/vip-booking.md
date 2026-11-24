Work: vip-booking
Status: accepted
Related: docs/briefs/vip-booking.md, docs/architecture/system-model.md, docs/investigations/vip-booking-priority.md
Supersedes: none

Four-pass calibration for this UI/product extension. Not a universal law.

## Objective

Add optional VIP booking policy (orchestrated VIP-first) to the existing three-stage booking experience while preserving standard non-preferential behaviour and the unchanged transactional allocator.

## Governing capabilities

Event inventory; Reservation allocation; Concurrent demand experience (standard | vip); Outcome inspection.

## Scope

In:

- Server-validated `bookingPolicy` (`standard` | `vip`), persisted on `experiment_runs` with default/backfill `standard` for historical rows
- Standard: shuffle + concurrent admission (unchanged)
- VIP: interactive allocation completes before competitors are admitted; then concurrent competitors
- VIP toggle on conditions stage (default off); outcome + evidence show recorded policy
- Tests for both policies per acceptance criteria

Out:

- Allocator redesign; VIP pools; auth/membership; priority queues; holds; payments; messaging; AWS

## Preserve

Living system-model invariants and Booking policy / Reservation outcome authority contracts. No synthetic success; no inventory override; no client-authoritative completed policy.

## External seams not crossed

No new external providers or secrets.

## Pass 1 — UI / structure

VIP toggle on conditions (upper-right preference); outcome/evidence placeholders for policy copy. Local toggle state only.

## Pass 2 — Data / state

Wire `bookingPolicy` through API client, experiment config types, migrate/persist column, include in returned `ExperimentResult.config`. Reset VIP toggle on Start another experience after successful reset.

## Pass 3 — Derived behaviour / logic

Validate policy server-side; branch orchestration standard vs VIP-first; outcome/evidence derive policy from recorded run; VIP rejection still allows competitors.

## Pass 4 — Polish / coherence

Copy, toggle layout, evidence clarity. No new behaviour.

## Acceptance

- Standard behaviour preserved
- VIP allocates before competitors start; VIP can still miss out; rejection allocates nothing; competitors proceed
- Both policies: no oversell, reconciliation, recorded policy in evidence
- Uncertain/errors not mislabeled as availability rejection

## Proof

`npm test`, `npm run typecheck`, human VIP/standard walkthrough.

## Stop / return

Stop if allocator must change, VIP pool appears required, or policy cannot be persisted authoritatively.

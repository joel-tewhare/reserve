Work: vip-booking
Status: accepted
Related: docs/architecture/system-model.md, docs/investigations/vip-booking-priority.md, docs/briefs/booking-experience.md
Supersedes: none

## Intent

Add an optional VIP booking policy to the existing three-stage booking experience so visitors can compare how priority orchestration affects outcomes under competing demand, without changing the transactional allocator or inventory authority.

## Users

Same as the booking experience: portfolio visitors and engineers. VIP is a demonstration policy toggle, not a membership entitlement.

## Success

When this works, a visitor can:

1. Optionally enable VIP on the booking conditions stage (off by default).
2. Confirm under **standard** (unchanged non-preferential competition) or **VIP** (interactive allocation completes before competitors are admitted).
3. See when VIP priority applied in the personal/wider outcome communication.
4. Inspect engineering evidence that records the policy actually applied for that run.
5. Trust that VIP still respects inventory limits, all-or-nothing allocation, genuine competitors, and reconciliation.

## Core flow

1. Stages 1–3 unchanged in structure.
2. On conditions: optional VIP toggle (prefer upper-right), copy along the lines of “Enable VIP to get priority access to tickets.”
3. Confirm uses existing experiment path with server-validated policy.
4. Outcome/evidence reflect recorded policy; Start another experience behaviour unchanged.

## UX shape

Preserve the three-stage experience. VIP is a secondary control, not a new primary form section. Avoid tutorial complexity.

## Scope

In:

- Orchestrated VIP-first policy; standard policy preserved
- Server-validated, persisted booking policy on experiment runs
- UI toggle, outcome/evidence communication
- Verification for both policies per investigation/acceptance

Out:

- VIP inventory pools, auth/membership, priority queues, holds, payments, messaging, AWS
- Allocator redesign unless later investigation proves necessary
- Guaranteed VIP success when inventory is insufficient

## Open questions

None.

Work: vip-booking
Status: complete
Related: docs/plans/vip-booking.md, docs/architecture/system-model.md
Supersedes: none

## Shipped

- Optional VIP booking policy with orchestrated VIP-first admission; standard shuffle+concurrent path preserved
- `booking_policy` persisted on `experiment_runs` (default `standard` for historical meaning)
- Server validation of `standard` | `vip`; returned in experiment `config`
- VIP toggle on booking conditions; outcome/evidence reflect recorded policy
- Allocator unchanged

## Not touched

VIP pools, auth/membership, priority queues, holds, payments, messaging, AWS

## Invariants

Preserved per living system model (policy-split preferential rules; booking policy authority).

## Deviations

None material.

## Proof

- `npm test` including VIP-first success, VIP rejection with competitors proceeding, standard path
- `npm run typecheck`
- Human walkthrough expected

## Remaining limitations

VIP priority is orchestration sequencing, not a concurrent DB priority queue.

## Architecture

System model already living for VIP; no further consequential change.

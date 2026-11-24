Work: vip-booking-priority
Status: complete
Related: docs/architecture/system-model.md, docs/briefs/reserve.md, docs/briefs/booking-experience.md
Supersedes: none

## Question

Can Reserve introduce an optional VIP booking priority policy under competing demand while preserving the existing transactional allocator and architectural honesty — and what must be decided before implementation?

## Evidence

### Where non-preferential behaviour is established

1. **Living invariant** (`docs/architecture/system-model.md`): “The interactive user’s reservation receives no preferential allocation treatment relative to competing generated demand.” Concurrent demand capability is likewise defined as competition without preferential treatment.
2. **Product/plan artefacts** (`docs/briefs/reserve.md`, `docs/plans/reserve-mvp.md`, closeouts, README): standard booking is specified as no preferential treatment for the interactive request.
3. **Orchestration** (`server/domain/experiments.ts`): jobs are built as one `interactive` + N `generated`, then **Fisher–Yates shuffled** so the interactive request is not preferentially ordered, then executed via `mapPool` at the configured concurrency.
4. **Allocator** (`server/domain/allocation.ts`): `allocateReservation` is policy-agnostic. It uses `SELECT … FOR UPDATE`, all-or-nothing quantity checks, and inserts a reservation. `requester_kind` is recorded (`interactive` | `generated`) but does **not** affect lock order or eligibility.

### How the interactive request enters the competition

It is a peer job in the same job list as generated one-ticket requests. Fairness under standard policy is established by shuffle + concurrent workers racing on the same row lock — not by a special interactive code path in the allocator.

### Can priority use orchestration while preserving the allocator?

Yes. The simplest path that matches the stated behavioural intent (“first access … before competing requests are processed”) is:

- **Standard:** keep shuffle + concurrent `mapPool` (unchanged).
- **VIP:** await the interactive `allocateReservation` to completion first; then run generated competitors through the existing concurrent pool against remaining inventory.

The allocator stays unchanged. Competing requests remain genuine reservation calls. VIP still fails with authoritative `insufficient_inventory` if the VIP quantity alone cannot be satisfied. No VIP inventory pool is required.

True *concurrent* “priority” among simultaneous lock waiters is not what the proposed wording asks for; under `FOR UPDATE`, arrival/lock order decides winners among concurrent waiters. Preferential *first access before competitors are processed* is an orchestration sequencing guarantee, not a database priority queue.

### Associating policy with the completed experiment

Today `experiment_runs` stores `user_quantity`, `competing_requests`, `concurrency` only — no booking policy. The returned `config` object likewise has no policy field. Historical evidence for VIP would need the selected policy recorded on the run (and surfaced in API/`ExperimentResult`) so outcome/evidence does not depend on mutable UI toggle state after completion.

### What would need to evolve

| Artefact | Change |
|---|---|
| System model capability / invariant | Standard policy remains non-preferential; optional VIP is an explicit preferential demonstration policy |
| Possibly a small contract | Booking policy is server-recorded experiment metadata; client toggle is intent only |
| Brief / plan | New work slug (e.g. VIP booking) — not covered by accepted booking-experience plan |
| Schema / API / UI | Persist and return policy; VIP toggle; outcome + evidence copy |
| Verification | Standard path: no preferential ordering; VIP path: interactive allocates before competitors start; VIP can still miss out; no oversell; reconciliation holds |

### Scope boundaries (confirmed against proposal)

No VIP inventory pools, auth/membership, priority-queue infrastructure, holds, payments, messaging, or AWS. VIP is a selected demonstration policy.

## Classification

Likely depth: **Contractual**

This is not a Local UI tweak. It expands product behaviour and requires revising a governing invariant that currently forbids preferential interactive treatment in all cases.

## Options

1. **Orchestrated VIP-first (recommended default if accepted)** — VIP allocates first; then competitors run concurrently with existing allocator. Matches stated “before competing requests are processed.” Simplest; honest about being scheduling policy.
2. **Always-concurrent with VIP pinned to earliest job index** — weaker / misleading under concurrency > 1; does not reliably mean “before competitors are processed.”
3. **Defer VIP** — keep current invariant unchanged; no preferential policy.

## Non-decisions

This investigation does **not** lock:

- Final UX microcopy or exact toggle placement
- Schema column naming
- Whether VIP is framed as a named system-model capability vs a policy mode under Concurrent demand experience
- Implementation sequencing inside a future plan

It does not authorise implementation.

## Conclusion

**Decide**

Human acceptance is required before `architect` / `plan` / `implement` because:

1. VIP contradicts the current living invariant of universal non-preferential interactive treatment; that invariant must be consciously revised to “standard = fair competition; VIP = optional preferential demonstration policy.”
2. The intended priority semantics should be accepted as **orchestration sequencing** (VIP completes before competitors are admitted), not as a new allocator or reserved inventory mechanism.
3. Booking policy must be treated as authoritative experiment metadata for historical outcome/evidence.

Recommended defaults if accepted: Option 1; persist policy on `experiment_runs` / result `config`; keep allocator untouched; extend verification as above.

Next: `architect` (after human decision) → brief/plan for a new work slug → implement

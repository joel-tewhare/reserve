Status: living
Related: docs/briefs/reserve.md, docs/briefs/booking-experience.md, docs/investigations/vip-booking-priority.md

## Intent

Reserve demonstrates reliable concurrent allocation of finite ticket inventory through a staged ticket booking experience that feels approachable first, then optionally reveals engineering evidence.

Visitors may optionally select a VIP booking policy to experience how orchestration priority affects outcomes under competing demand, without changing the transactional allocator or inventory authority.

Success: a visitor can choose the demonstration event, set competing booking conditions (including optional VIP), confirm a genuine reservation experiment under the selected policy, receive an authoritative personal outcome, inspect wider booking results, and optionally open engineering evidence that records the applied policy and reconciles with authoritative database state without overselling.

Application technology direction: TypeScript, React, and Node.js.

Persistence technology direction: PostgreSQL is required. Practical familiarity with concurrent connections, transactions, locking, and database-enforced integrity is a primary educational objective—not an interchangeable persistence detail.

Longer direction: local-first execution with AWS-oriented architecture so genuine application behaviour can later run against infrastructure that corresponds to AWS services. v1 does not require AWS services. Local containerised PostgreSQL may be used where it aids reproducibility and future infrastructure correspondence.

## Capabilities

### Event inventory

Present a demonstration event with finite ticket capacity and authoritative availability.

### Reservation allocation

Accept reservation requests for a user-selected ticket quantity. Allocate all-or-nothing. Successful allocation is immediately final. Reject when inventory cannot satisfy the full quantity. Authoritative rejection or rolled-back work consumes no inventory. Allocation is policy-agnostic: booking priority is not implemented inside the allocator.

### Concurrent demand experience

Surround a user’s reservation with constrained, repeatable competing demand as genuine reservation requests against the same inventory.

Booking policy modes:

- **Standard** (default): the interactive request competes alongside generated requests without preferential treatment (shuffle + concurrent admission).
- **VIP** (optional demonstration policy): the interactive request receives first access by completing its allocation attempt before generated competing requests are admitted for processing (orchestrated VIP-first sequencing). Competitors then proceed as genuine concurrent reservation requests against remaining inventory.

VIP is an orchestration sequencing policy, not a reserved inventory pool, alternative allocator, concurrent priority queue, or guaranteed allocation.

### Outcome inspection

Reveal personal outcome and wider booking results in approachable language, with optional expandable engineering evidence. Communicate when VIP priority was applied. Distinguish expected availability rejections from unexpected errors and uncertain outcomes. Reconcile reservation counts, allocated ticket quantities, and remaining inventory against authoritative state. Outcome views and evidence remain associated with the experiment that produced them, including the recorded booking policy; ordinary navigation does not silently reset inventory.

## Boundaries

- **Client:** expresses reservation intent, experiment conditions, and selected booking policy; presents progressive context, outcomes, and evidence projections.
- **Server / source of truth:** validates requests and policy; performs allocation; orchestrates competing reservation work according to the validated policy; returns authoritative outcomes when available; exposes inspection data derived from real execution and persisted run metadata.
- **Never on the client:** inventory truth; reservation success/failure authority; booking-policy claims for a completed run that are not backed by server-validated, persisted experiment metadata; experiment “success” claims that are not backed by real request outcomes and database reconciliation.
- **Persistent authority:** inventory and reservation records live in PostgreSQL. Experiment booking policy is server-validated and persisted with the experiment run. Application memory and UI toggle state are not authoritative for completed runs.
- **External seams not crossed (v1):** live AWS APIs/accounts, real payment processors, commercial third-party ticketing APIs, permanent cloud hosting, VIP membership/auth entitlement systems.
- **AWS-oriented intent (not v1 delivery):** application behaviour and boundaries should remain substitutable toward corresponding AWS-backed infrastructure later; local infrastructure substitutes infrastructure, not application behaviour. Emulation, simulation, and genuine cloud deployment must remain distinguishable in documentation and claims.
- **Out of scope for VIP:** reserved VIP inventory pools, customer authentication/membership, priority-queue infrastructure, temporary holds, payments, messaging, AWS integration.

## Invariants

- Allocated ticket quantity for an event never exceeds capacity; available inventory never goes negative.
- A successful reservation record corresponds to committed allocated tickets in PostgreSQL.
- An *authoritative* rejection (including work that does not commit / rolls back) allocates no inventory.
- An interrupted, missing, or transport-failed response must not be treated as proof that allocation failed. A transaction may commit before the caller receives a response; uncertain request outcomes are not automatically authoritative allocation failures.
- Multi-ticket reservations are atomic (all-or-nothing) for the requested quantity.
- Under the **standard** booking policy, the interactive reservation receives no preferential allocation treatment relative to competing generated demand.
- Under the **VIP** booking policy, the interactive reservation’s allocation attempt is completed before generated competing requests are admitted; VIP does not override inventory availability or guarantee allocation when insufficient inventory exists.
- An authoritative VIP availability rejection consumes no inventory and does not prevent subsequent competing requests from proceeding against remaining inventory.
- Successful reservation *counts* and allocated *ticket quantities* are distinct measurements and must both reconcile with authoritative state alongside remaining inventory.
- Expected availability-based rejections are not treated as application errors or correctness violations.
- Displayed booking outcomes and engineering evidence must reflect genuine request processing, the recorded booking policy for that run, and authoritative database reconciliation — not synthetic scores or mutable UI toggle state after completion.
- Concurrent booking experiments run from known, repeatable initial conditions; reset to those conditions is explicit (e.g. starting another experience), not an implicit side effect of ordinary navigation.
- Proposed booking conditions and historical conditions of a completed experiment must not be confused with current available inventory or authoritative completed outcomes.

## Authority / state

- **Operational truth:** PostgreSQL records for event inventory and reservations (committed transactional state), plus server-persisted experiment-run metadata including the validated booking policy.
- **Projections:** booking UI views of inventory, personal outcomes, aggregate experiment results, and engineering evidence. Stale, optimistic, or transport-failed UI must not be treated as proof of allocation success or failure, nor of which policy governed a completed run.
- **Experiment evidence:** derived from executed reservation requests under the recorded policy, plus reconciliation against operational truth after the run.
- **Historical experiment records:** runs created before booking-policy persistence are interpreted as **standard** policy (the only policy that existed). Schema evolution should preserve that meaning (e.g. default/backfill `standard`).

## Contracts

### Reservation outcome authority

Authoritative allocation success or rejection is determined by committed PostgreSQL state, and by a corresponding authoritative server outcome when one is available.

Transport failure, interrupted responses, or missing responses must not be equated with authoritative allocation failure.

Comprehensive recovery, reconciliation workflows, or idempotent retry product behaviour for uncertain outcomes are out of scope for v1; their absence must not be papered over by an inaccurate failure guarantee.

### Booking policy authority

The booking policy for an experiment (`standard` | `vip`) is validated by the server and persisted with the experiment run before competing work is interpreted under that policy.

Client VIP toggle state expresses intent only. Completed outcome presentation and engineering evidence must derive the applied policy from recorded run metadata (with pre-policy historical runs treated as `standard`), not from the current UI toggle.

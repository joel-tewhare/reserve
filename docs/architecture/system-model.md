Status: living
Related: docs/briefs/reserve.md

## Intent

Reserve demonstrates reliable concurrent allocation of finite ticket inventory through a single Engineering Console that feels like a real reservation journey and then reveals engineering evidence.

Success for the first version: a user can reserve under configured competing demand, receive an authoritative personal outcome (including correct rejection), and inspect wider outcomes that reconcile with authoritative database state without overselling.

Application technology direction: TypeScript, React, and Node.js.

Persistence technology direction: PostgreSQL is required. Practical familiarity with concurrent connections, transactions, locking, and database-enforced integrity is a primary educational objective—not an interchangeable persistence detail.

Longer direction: local-first execution with AWS-oriented architecture so genuine application behaviour can later run against infrastructure that corresponds to AWS services. v1 does not require AWS services. Local containerised PostgreSQL may be used where it aids reproducibility and future infrastructure correspondence.

## Capabilities

### Event inventory

Present a demonstration event with finite ticket capacity and authoritative availability.

### Reservation allocation

Accept reservation requests for a user-selected ticket quantity. Allocate all-or-nothing. Successful allocation is immediately final. Reject when inventory cannot satisfy the full quantity. Authoritative rejection or rolled-back work consumes no inventory.

### Concurrent demand experience

Surround a user’s reservation with constrained, repeatable competing demand so the user’s request and generated customer requests compete as genuine requests against the same inventory, without preferential treatment for the interactive user.

### Outcome inspection

Reveal personal outcome, wider experiment outcomes, and engineering evidence that distinguishes expected availability rejections from unexpected errors and correctness violations, including reconciliation of reservation counts, allocated ticket quantities, and remaining inventory against authoritative state.

## Boundaries

- **Client:** expresses reservation and experiment intent; presents progressive context, outcomes, and evidence projections.
- **Server / source of truth:** validates requests; performs allocation decisions; orchestrates or admits competing reservation work; returns authoritative outcomes when available; exposes inspection data derived from real execution.
- **Never on the client:** inventory truth; reservation success/failure authority; experiment “success” claims that are not backed by real request outcomes and database reconciliation.
- **Persistent authority:** inventory and reservation records live in PostgreSQL. Application memory and UI state are not authoritative. Mock or in-memory database substitutes are not acceptable for demonstrating concurrency or transactional integrity.
- **External seams not crossed (v1):** live AWS APIs/accounts, real payment processors, commercial third-party ticketing APIs, permanent cloud hosting.
- **AWS-oriented intent (not v1 delivery):** application behaviour and boundaries should remain substitutable toward corresponding AWS-backed infrastructure later; local infrastructure substitutes infrastructure, not application behaviour. Emulation, simulation, and genuine cloud deployment must remain distinguishable in documentation and claims.

## Invariants

- Allocated ticket quantity for an event never exceeds capacity; available inventory never goes negative.
- A successful reservation record corresponds to committed allocated tickets in PostgreSQL.
- An *authoritative* rejection (including work that does not commit / rolls back) allocates no inventory.
- An interrupted, missing, or transport-failed response must not be treated as proof that allocation failed. A transaction may commit before the caller receives a response; uncertain request outcomes are not automatically authoritative allocation failures.
- Multi-ticket reservations are atomic (all-or-nothing) for the requested quantity.
- The interactive user’s reservation receives no preferential allocation treatment relative to competing generated demand.
- Successful reservation *counts* and allocated *ticket quantities* are distinct measurements and must both reconcile with authoritative state alongside remaining inventory.
- Expected availability-based rejections are not treated as application errors or correctness violations.
- Console-displayed experiment outcomes and evidence must reflect genuine request processing and authoritative database reconciliation, not synthetic scores.
- Concurrent console experiments run from known, repeatable initial conditions with isolation/reset sufficient for reproducible evidence.

## Authority / state

- **Operational truth:** PostgreSQL records for event inventory and reservations (committed transactional state).
- **Projections:** console views of inventory, personal outcomes, aggregate experiment results, and engineering evidence. Stale, optimistic, or transport-failed UI must not be treated as proof of allocation success or failure.
- **Experiment evidence:** derived from executed competing requests plus reconciliation against operational truth after the run.

## Contracts

### Reservation outcome authority

Authoritative allocation success or rejection is determined by committed PostgreSQL state, and by a corresponding authoritative server outcome when one is available.

Transport failure, interrupted responses, or missing responses must not be equated with authoritative allocation failure.

Comprehensive recovery, reconciliation workflows, or idempotent retry product behaviour for uncertain outcomes are out of scope for v1; their absence must not be papered over by an inaccurate failure guarantee.

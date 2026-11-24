Work: reserve-mvp
Status: accepted
Related: docs/briefs/reserve.md, docs/architecture/system-model.md
Supersedes: none

Four-pass calibration for this UI/product MVP. Not a universal law.

Incremental sequence inside this plan: establish and verify correct single-request reservation before completing the concurrent-demand experience. v1 is not complete until concurrent allocation correctness is observable through the integrated reservation journey.

## Objective

Deliver the first Reserve Engineering Console experience: a realistic event reservation under constrained concurrent demand, with authoritative personal outcomes and inspectable engineering evidence that reconciles to PostgreSQL truth without overselling.

## Governing capabilities

From `docs/architecture/system-model.md`:

- Event inventory
- Reservation allocation
- Concurrent demand experience
- Outcome inspection

## Scope

In:

- One integrated console surface (reservation journey + demand conditions + progressive outcome/evidence reveal)
- TypeScript / React / Node.js application stack
- PostgreSQL as the required authoritative store (local containerised PostgreSQL permitted for reproducibility)
- Demonstration event with finite inventory and resettable known initial conditions
- Immediate-final, all-or-nothing reservation by selected ticket quantity
- Constrained concurrent demand surrounding the user’s confirmation, implemented as genuine competing reservation requests with no preferential treatment for the interactive user
- Personal outcome plus wider outcomes with reconciliation of successful reservation counts, allocated ticket quantities, remaining inventory, expected availability rejections, and unexpected errors/correctness violations
- Honest handling of uncertain/transport-failed outcomes without equating them to authoritative allocation failure (no comprehensive uncertain-outcome recovery product in v1)
- Documentation aligned with what v1 actually does, including local-first / AWS-oriented intent without claiming AWS delivery

Out:

- Temporary holds, expiration, confirm/cancel lifecycle
- Simulated payments, messaging workers, multi-instance distribution, AWS integration/deployment
- Separate customer storefront or separate engineering-only app
- Full GitHub Pages portfolio preview product
- Unbounded load generation or privileged infrastructure control from the console
- Replacing dedicated concurrency/load tests with console experiments alone
- Expanding v1 into detailed performance benchmarking
- Comprehensive recovery product for uncertain request outcomes

## Preserve

- Client never owns inventory or reservation authority
- PostgreSQL committed state is operational truth for inventory and reservations
- No overselling; no negative inventory
- Authoritative rejection / rolled-back work allocates nothing; transport or missing responses are not automatically authoritative allocation failures
- All-or-nothing multi-ticket allocation
- No preferential treatment for the interactive user’s reservation
- Reservation counts ≠ ticket quantities; both must reconcile with remaining inventory
- Availability rejections ≠ application errors ≠ correctness violations ≠ uncertain transport outcomes
- Experiment results and evidence must come from real execution + PostgreSQL reconciliation
- Experiments start from known, repeatable, isolatable conditions
- Do not expand into AWS services, payments, holds, or distributed topology merely to look complete
- Do not invent new capabilities, invariants, or contracts silently — return to architect

## External seams not crossed

Mock-first for external providers: no live AWS API usage, no real cloud credentials required to run v1, no real payment providers, no commercial ticketing APIs, no mandatory third-party accounts for local reproduction.

Internal backend, seeded demonstration data, local PostgreSQL, and genuine in-process/in-environment concurrent requests are in scope. In-memory or mock database substitutes are not acceptable for concurrency/transactional proof.

## Pass 1 — UI / structure

Primary: shape the single console journey as progressive stages:

1. Event + inventory context
2. Quantity selection + constrained demand-condition review (pre-confirm clarity)
3. Confirm action
4. Personal outcome
5. Wider outcomes + engineering evidence reveal

Define visible states for loading, ready, confirming, personal success, personal availability rejection, unexpected error / uncertain outcome, and post-run evidence. Use minimal local placeholder state only to make the structure inspectable. Do not implement authoritative allocation or real competing demand here.

## Pass 2 — Data / state

Primary: wire console stages to internal authoritative PostgreSQL-backed sources.

- Seeded demonstration event and inventory in PostgreSQL
- Read paths for inventory and reservation/experiment projections
- Write/submit path for a reservation request (if exposed)
- Loading / empty / error / uncertain-outcome wiring for those reads and submits
- Experiment run identity, configured demand settings, and post-run result/evidence payloads as data shaped from real execution records (or clearly empty until Pass 3 produces them)
- Reset/initial-condition support for returning inventory/reservations to a known baseline

**Pass 2 → Pass 3 sequencing rule:** authoritative reservation persistence and transactional allocation correctness are closely related. If reservation creation becomes operational during Pass 2, it must already preserve the accepted allocation invariants (all-or-nothing, no oversell, no inventory consumption on authoritative rejection). Alternatively, reservation allocation may remain unavailable until Pass 3. Do not ship operational persistence that omits the transactional guarantees required to make that persistence valid merely to keep the passes tidy. Exact sequencing is an implementation decision inside this rule.

## Pass 3 — Derived behaviour / logic

Primary: authoritative allocation and concurrent demand behaviour (and any allocation deferred from Pass 2).

- Validate reservation requests (including invalid quantity handling)
- All-or-nothing allocation against finite inventory with immediate-final success or availability rejection, under PostgreSQL transactional integrity
- Surround confirmed interactive reservations with constrained generated competing demand as genuine reservation requests against the same inventory
- Ensure no preferential treatment for the interactive user
- Produce personal outcome and aggregate outcomes without mislabeling uncertain/transport failures as authoritative allocation failures
- Reconcile successful reservation counts, allocated ticket quantities, remaining inventory, expected rejections, and unexpected errors/correctness violations against authoritative PostgreSQL state
- Keep experiment controls constrained; fail safely on invalid configuration rather than unbounded load

Single-request correctness should be proven before claiming the concurrent experience complete. Concurrent demonstration through the integrated journey is required for MVP acceptance.

## Pass 4 — Polish / coherence

Primary: tighten progressive reveal, clarity that personal rejection can be correct, labelling of evidence vs claims (including uncertain outcomes), empty/error coherence, responsiveness of the console stages, and cleanup. No new product behaviour or scope. No AWS or payments surface dressing. No performance-benchmark theatre.

## Acceptance

- User can complete the integrated reservation-under-demand journey in the console
- Personal outcomes are authoritative when the server/database outcome is known; rejection may correctly occur under demand
- Inventory never oversells; authoritative rejections allocate no tickets; multi-ticket requests are all-or-nothing
- Competing demand consists of genuine requests; interactive user is not favoured
- Post-run evidence reconciles reservation counts, ticket quantities, and remaining inventory to PostgreSQL truth
- Expected availability rejections are distinguishable from unexpected errors, correctness violations, and uncertain/transport outcomes
- Experiments are resettable to known initial conditions
- v1 docs do not claim AWS deployment, payments, holds, synthetic experiment success, or that transport failure equals allocation failure

## Proof

Required automated verification against genuine PostgreSQL persistence:

- All-or-nothing multi-ticket allocation
- No overselling under competing requests
- No inventory consumption on authoritative rejection
- Reconciliation of successful reservation counts, allocated ticket quantities, and remaining inventory
- Relevant invalid quantity handling

Also required:

- Typecheck / lint as applicable to the resulting codebase
- At least one reproducible concurrent console (or equivalent API-level) experiment against known initial conditions with recorded reconciliation outcome
- Human walkthrough of the progressive console journey after closeout

Correctness verification is distinct from performance benchmarking. Detailed performance benchmarking is not required to expand v1. Console experiments complement, and do not replace, the required automated verification above.

Exact commands to be named at implement time from the repo’s actual scripts.

## Stop / return

Stop and return to `architect` or `preplan` if:

- Preferential treatment, synthetic results, or client-authoritative inventory would be required to “make the demo work”
- Temporary holds, payments, messaging, multi-instance distribution, or AWS services are needed to satisfy acceptance
- A new invariant, capability, or authority rule is required beyond the living system model
- Product behaviour for demand configuration or outcome meaning becomes ambiguous
- An external side-effect boundary (live AWS, real payments, secrets) would be crossed
- Mock/in-memory persistence would be substituted for PostgreSQL in correctness proof

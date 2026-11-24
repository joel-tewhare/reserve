Work: reserve
Status: accepted
Related: docs/architecture/system-model.md
Supersedes: none

## Intent

Reserve is a local-first, AWS-oriented engineering portfolio project that demonstrates reliable transactional reservation behaviour under concurrent demand.

Ticket reservations are the business context. The engineering subject is concurrent allocation of finite inventory, authoritative shared state, and verifiable correctness. The product experience should make that behaviour observable through a realistic reservation journey, not merely describe it or present a bare technical test harness.

AWS-oriented architecture is foundational project direction. Deferring AWS *implementation* in early versions is appropriate; deferring AWS *architectural intent* is not.

## Users

- **Primary:** the engineer developing and demonstrating Reserve (experiencing reservation under demand, inspecting outcomes, reproducing concurrency behaviour).
- **Secondary:** a technical portfolio visitor who needs to understand the problem, experience the console’s meaning, and later reproduce the environment if interested.

Not a commercial ticketing customer base. Not an event-operator admin product. Not a separate customer storefront or independent engineering application.

## Success

When this first version works, a user can:

1. View a demonstration event and its available ticket inventory.
2. Select a desired ticket quantity and review the demand conditions under which their reservation will compete.
3. Confirm a reservation that competes with generated customer demand against the same authoritative inventory, without preferential treatment for the interactive user.
4. Receive their own authoritative outcome (success with allocated tickets, or availability-based rejection) and understand that rejection may be a correct system result.
5. See wider experiment outcomes and engineering evidence that reconcile API results with authoritative database state.
6. Observe that successful reservation counts and allocated ticket quantities are distinct measurements, inventory never oversells, and authoritative rejections consume no inventory (without treating transport/uncertain outcomes as automatic allocation failures).
7. Trust that displayed outcomes reflect real competing requests and real application behaviour, not synthetic illustration.

Basic single-request reservation may be implemented and verified as an earlier milestone. Concurrent allocation correctness and its observable demonstration through the reservation experience are required for v1 completion.

## Core flow

1. Open the single integrated Engineering Console against a running Reserve environment.
2. View a demonstration event and authoritative ticket inventory.
3. Select the desired ticket quantity (all-or-nothing allocation).
4. Configure or select constrained concurrent demand conditions surrounding the reservation.
5. Before confirmation, review clear communication of available inventory, competing demand, and concurrency settings.
6. Confirm the reservation; the user’s request competes with generated customer reservation requests against the same inventory.
7. Receive the user’s personal authoritative reservation outcome.
8. Review wider experiment outcomes and engineering evidence (including reconciliation against authoritative database state), distinguishing expected availability rejections from unexpected errors and correctness violations.

## UX shape

One integrated **Engineering Console** that combines a realistic customer-style reservation experience with progressive engineering inspection.

Progressive reveal:

1. Event and ticket reservation context
2. Demand conditions surrounding the reservation
3. The user’s personal reservation outcome
4. Wider system outcomes
5. Engineering evidence of correctness (or failure)

Tone: technically informative, calm, and focused. Enough realism for concurrent demand to feel meaningful; not a commercial ticketing storefront. Experiment controls remain deliberately constrained. Console experiments complement, rather than replace, dedicated concurrency and load testing.

The reservation experience should remain a foundation that can later absorb temporary holds, simulated payments, asynchronous processing, and distributed infrastructure without becoming a different product.

## Scope

In:

- Simplified event + finite inventory representation
- Immediate-final reservation on successful allocation (user-selected quantity; all-or-nothing)
- Single integrated console: realistic reservation journey + surrounding demand conditions + outcome/evidence reveal
- Genuine competing requests for concurrent-demand experiences (including the interactive user’s request)
- Observable concurrent allocation correctness with reconciliation to authoritative database state
- Known, repeatable experiment initial conditions with isolation and reset suitable for reproducible evidence
- Portfolio Level One understanding via repository documentation that matches what the product actually does
- Preservation of local-first, AWS-oriented architectural intent for later infrastructure correspondence

Out (for this first version; retained as broader project direction, not abandoned):

- Temporary holds / timed expiration / confirm-cancel lifecycle
- Simulated payment provider flows
- Asynchronous messaging / background workers as a product-facing concern
- Multi-instance / full distributed infrastructure as a required v1 deliverable
- AWS service integration or genuine cloud deployment as a required v1 deliverable
- Complex event administration, seating maps, CRM, marketing, real payments
- Multi-tenant commercial architecture and rich auth/permissions product work
- Full static GitHub Pages portfolio preview app
- Emulating or representing the full AWS service catalogue in the console
- Unbounded or privileged experiment orchestration (e.g. unrestricted Docker daemon access from the console)

## Open questions

None.

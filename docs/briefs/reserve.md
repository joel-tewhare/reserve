Work: reserve
Status: draft
Related: none
Supersedes: none

## Intent

Reserve is a local-first engineering portfolio project that demonstrates reliable transactional reservation behaviour under concurrent demand.

Ticket reservations are the business context. The engineering subject is concurrent allocation of finite inventory, authoritative shared state, and verifiable correctness. The product experience should make that behaviour observable, not merely describe it.

## Users

- **Primary:** the engineer developing and demonstrating Reserve (running the system, performing reservations, inspecting outcomes, reproducing concurrency behaviour).
- **Secondary:** a technical portfolio visitor who needs to understand the problem, experience the console’s meaning, and later reproduce the environment if interested.

Not a commercial ticketing customer base. Not an event-operator admin product.

## Success

When this first version works, a user can:

1. See an event with finite ticket inventory and authoritative availability.
2. Request a reservation and receive an authoritative success or availability-based rejection.
3. Observe that successful reservations correspond to real inventory allocation and that rejected requests do not consume inventory.
4. Run or trigger a concurrent-demand scenario against that inventory and see aggregate outcomes that preserve the core invariant (no overselling; successful counts match allocated inventory).
5. Trust that displayed inventory, reservation outcomes, and experiment results reflect real application behaviour rather than synthetic illustration.

## Core flow

1. Open the Engineering Console against a running Reserve environment.
2. View an event’s inventory state (capacity, available, reserved/confirmed as applicable to this version).
3. Submit a reservation request for a ticket quantity the user chooses (default: one).
4. Receive an authoritative outcome: reserved/confirmed, or rejected for availability (or invalid request).
5. See inventory and reservation records update to match that outcome.
6. Configure and run a concurrent reservation experiment (many competing requests against limited inventory).
7. Review aggregate results that distinguish expected availability rejections from correctness failures.

## UX shape

A focused **Engineering Console** as the primary product surface.

Default first-version layout intent:

- **Event / inventory panel** — current authoritative inventory state for a simple demonstration event.
- **Reservation action** — request a reservation and see the immediate authoritative result.
- **Reservation visibility** — recent or selected reservation outcomes and lifecycle state for this version.
- **Concurrent experiment panel** — configure a concurrent workload (request count / concurrency), run it, and review measured outcomes tied to the same authoritative inventory.
- Clear labelling that outcomes come from the live system, not demo fiction.

Tone: technically informative, calm, dense enough for engineering inspection, not a marketing ticketing storefront.

No requirement for a separate polished consumer storefront in this version unless product questions below change that.

## Scope

In:

- Simplified event + finite inventory representation
- Reservation creation with authoritative success / availability rejection
- Engineering Console for inventory visibility, reservation interaction, and concurrent experiment observation
- Correctness under concurrent demand as a first-class product behaviour (observable and demonstrable)
- Portfolio Level One understanding via repository documentation that matches what the product actually does

Out (for this first version):

- Temporary holds / timed expiration lifecycle
- Simulated payment provider flows
- Asynchronous messaging / background workers as a product-facing concern
- Complex event administration, seating maps, CRM, marketing, real payments
- Multi-tenant commercial architecture and rich auth/permissions product work
- Permanent cloud hosting / genuine AWS deployment as a required deliverable
- Full static GitHub Pages portfolio preview app (desirable later; not required to define this first working product)
- Emulating or representing the full AWS service catalogue in the console

## Open questions

1. **Surfaces:** Is the Engineering Console the only interactive surface in v1, or should there also be a simple customer-style “reserve a ticket” path as a distinct experience?
2. **Reservation outcome model:** For v1, is a reservation immediately final on success (allocated + confirmed-equivalent), or must temporary hold → confirm/cancel/expire exist in this first version?
3. **Experiment interaction:** Must the console itself host interactive concurrent experiment controls in v1, or is observing normal reservations enough in-console while concurrency experiments are reproduced outside the UI for this version?
4. **Success bar:** Does “first working version” require the concurrent experiment proof in the same slice as basic reservation UX, or can correct single-request reservations ship first with concurrency demonstration immediately after?

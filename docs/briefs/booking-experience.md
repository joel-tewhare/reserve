Work: booking-experience
Status: accepted
Related: docs/briefs/reserve.md, docs/architecture/system-model.md
Supersedes: none

## Intent

Evolve Reserve’s presentation from a vertically stacked Engineering Console into an approachable, staged ticket booking experience.

Visitors experience competing ticket demand through a familiar booking journey, then may optionally explore the engineering behind their outcome. This is primarily presentation, navigation, and communication — not a change to underlying reservation capabilities.

## Users

- **Primary:** portfolio visitors and engineers experiencing Reserve through a booking journey.
- **Secondary:** engineers inspecting optional engineering evidence after an outcome.

Not a commercial ticketing product. Not a separate storefront or admin console.

## Success

When this version works, a visitor can:

1. Meet Reserve as a ticket booking experience and select the demonstration event (with current available tickets).
2. Set booking conditions (tickets 1–10, competitors up to 250, concurrency 1–25) with a clear demand-vs-inventory summary, including natural language when demand exceeds availability.
3. Confirm a booking that runs the existing genuine concurrent reservation experiment.
4. Discover their personal outcome in approachable language, distinct from unexpected errors and uncertain outcomes.
5. See wider booking results in accessible language, with reservation counts distinct from ticket quantities.
6. Optionally expand genuine engineering evidence for the completed run.
7. Start another experience, which resets to known demonstration conditions before beginning again — without ordinary Back/navigation silently resetting inventory.

## Core flow

1. **Choose your event** — intro (“This is RESERVE. Your ticket booking experience.”) and clickable event card → booking conditions.
2. **Set booking conditions** — three vertical sections (tickets, competitors, concurrency), demand summary, Back / Confirm booking.
3. **Discover your outcome** — personal outcome → wider booking outcome → optional expandable engineering evidence → Start another experience.

Progress is shown as three distinct stages (not simultaneously stacked sections).

## UX shape

Approachable, considered ticket booking application: clear typography, generous spacing, one primary action per stage, progressive disclosure of technical detail, responsive layout.

Tone: natural and user-friendly in the journey; engineering identity retained but revealed after participation, not required beforehand.

States: loading, success, availability rejection (“missed out”), unexpected error, and uncertain outcome remain distinct.

## Scope

In:

- Three-stage booking presentation over existing APIs and allocation behaviour
- Progress indication; Back without silent reset; Start another experience with authoritative reset
- Approachable outcome and wider-results copy; optional engineering evidence for the completed experiment
- Existing resource limits and oversubscription behaviour preserved

Out:

- Priority / guaranteed booking
- Temporary holds, payments, messaging, AWS integration
- Dedicated educational tutorials/diagrams inside the booking journey
- Changing PostgreSQL authority, transactional allocation, genuine competing requests, or evidence authenticity

## Open questions

None.

# Process overview

<!-- DRAFT: this is a skeleton, not a finished account — the mechanical facts
     are filled in, but the framing, the corrections you made, and the
     prompts you actually gave are yours to add. Replace this comment once
     you've done that. -->

## What I built

A crowd-sourced campus food finder: a single directory of ANU eating places
(name, building, cuisine, price range, optional location note), filterable by
building and cuisine, with no accounts, ratings, or edit path — see PLAN.md
for what's deliberately out of scope and why. Seeded with ten known campus
places so the list isn't empty on first load.

## How I got here

The plan (`PLAN.md`) called for writing the two mechanically-checkable spec
promises as failing tests before any implementation: that a submitted place
survives a reload, and that filtering by building/cuisine narrows the list.
[TODO: say why you wanted the tests red first, in your own words — what
would have gone wrong if you'd built the feature before the test.]

- `spec/places.test.ts` was written and run against the unmodified starter,
  confirming it failed for the right reason (`POST /api/places` 404ing, the
  homepage still serving the guestbook) rather than a typo in the test
  itself.
- Schema, migration, db layer, API route, seed data, and the reworked
  `index.astro` landed together in
  [`57b2730`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/57b2730),
  which also retired the guestbook's SSE plumbing (`events.ts`,
  `api/messages.ts`, `api/events.ts`, `guestbook.test.ts`) now that it's
  replaced.
- `pnpm check` green after: typecheck clean, both new places tests passing,
  invariants and readme checks unaffected.

[TODO: quote the prompt(s) you actually gave that directed this work,
curated rather than a full transcript, e.g.:]

> the prompt, verbatim

[TODO: note any point where you corrected the agent's approach, or where you
checked its output against the spec/plan yourself rather than taking it on
trust.]

## Before you ship

`pnpm check:evidence` verifies that this comment is gone, that your citations
resolve to real commits, that a crit week's reflection entry is in
`reflections/`, and that your `CLAUDE.md` is there. It checks that your account
is traceable, not that it is good: that is the marker's call.

Images aren't checked: unlike a citation whose SHA doesn't resolve, a broken
image is visible the moment this file is rendered on GitHub.

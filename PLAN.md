# Plan: campus food finder

## The system

ANU has no reliable single source for "what food exists on campus and where" —
the union court and building cafes are scattered across the uni site, Google
Maps, and word of mouth, and none of them agree. This models that slice: a
crowd-sourced directory of campus food places, filterable by building, cuisine
and price.

## Out of scope (deliberately)

- no accounts/auth — anyone can add a place
- no map/geolocation — a text location note is enough
- no reviews, ratings or photos
- no real-time open/closed status
- no per-item menus
- no edit/delete/correction path — a bad or duplicate entry has no fix once
  submitted. This is a real gap for a crowd-sourced directory, not an
  oversight: fixing it needs some notion of ownership or moderation, which
  drags in the auth we've already ruled out. Flagged here so it's an explicit
  cut, not a surprise at the crit.

## Data model

`places` table (replaces the starter's `messages` table):

| column        | type   | notes                                                        |
| ------------- | ------ | -------------------------------------------------------------- |
| `id`          | int    | primary key, autoincrement                                    |
| `name`        | text   | required                                                       |
| `building`    | text   | required, one of a fixed list — see below                     |
| `locationNote`| text   | optional free text, e.g. "ground floor, near the ANU bar"      |
| `cuisine`     | text   | required, one of a fixed list — see below                     |
| `priceRange`  | text   | required, one of `$` / `$$` / `$$$`                            |
| `createdAt`   | text   | default `datetime('now')`                                      |

### Controlled vocabularies

`building` and `cuisine` are free text in the naive version, but free text
fragments a filter ("asian" vs "Asian" vs "chinese" become three different
filter values). Decision: both are `<select>` dropdowns backed by a fixed list,
not open text fields:

- **building**: a short curated list of the campus buildings that actually
  have food (Union Court, Copland, Hancock, Chifley, Marie Reay, RSC, JCSMR,
  ...) — extend the list as places get added, but never let the form free-type it
- **cuisine**: a small fixed set (coffee, bakery, asian, western, halal,
  vegetarian-friendly, food-court, other) covering common cases

**One cuisine per place for this slice.** A food court serving several
cuisines doesn't fit one field cleanly, and a proper fix is a
`place_cuisines` join table. Deferred: pick the single best-fit tag (or
`food-court`) for now: this week is a database-modelling exercise, and it is a
fine call to make the join table an explicit stretch goal rather than build it
up front. If cuisine gets used in the crit as "argue what you'd model
differently," this is the answer.

### Form validation

- `name`: required, `maxlength="200"`
- `building`: required `<select>`, no empty option
- `cuisine`: required `<select>`, no empty option
- `priceRange`: required `<select>` of exactly `$` / `$$` / `$$$`
- `locationNote`: optional, `maxlength="280"`

## End-to-end flow

The flow that must survive a reload: `/` lists all places, filterable by
building/cuisine via query params (server-rendered, no client JS needed). An
inline form posts to `POST /api/places`, which writes to SQLite and redirects
back to `/` — the new place is in the list, and still there after a reload or
redeploy.

## What retires from the starter

The guestbook is starter plumbing, not part of this slice — it goes when the
starter does:

- `messages` table in `schema.ts`
- `guestbook.test.ts`
- `src/lib/events.ts` and the SSE stream
- `src/pages/api/messages.ts`, `src/pages/api/events.ts`
- the guestbook UI in `index.astro`

## Build order

- [ ] Write the failing spec tests first: (a) submit a place via the API,
      reload, assert it's listed (mirrors `guestbook.test.ts`'s persistence
      check, now for places); (b) filtering by building/cuisine actually
      narrows the list
- [ ] `schema.ts`: add the `places` table → `pnpm db:generate` → commit schema
      and migration together
- [ ] `db.ts`: `listPlaces` / `filterPlaces` / `insertPlace`
- [ ] `/api/places` POST handler, enforcing the form validation above
- [ ] Seed a handful (~10) of known campus places on first boot, so the crit
      demo isn't an empty list
- [ ] Rework `index.astro` into the list+filter+form page; drop the guestbook
      UI. Every filter control and form field keeps a `<label>`, the page
      keeps one `<h1>` and its nav landmark — `invariants.test.ts` checks all
      of this and won't say which one broke
- [ ] Delete the retiring guestbook plumbing and its test
- [ ] No detail page in this slice — everything lives on `/`, so
      `spec/routes.ts` stays `["/", "/readme/"]` unchanged. (Revisit if a
      `/places/[id]` page gets added later — then it needs adding there too.)
- [ ] `pnpm check` green
- [ ] Keep `PROCESS.md` and `reflections/crit-7.md` current as the work lands
- [ ] Deploy before the cutoff, confirm the live URL

## Spec lines, sorted

Mechanically checkable, ours to test:

- "the core flow persists across a reload" → the persistence test above
- filtering by building/cuisine narrows the list — not a quoted spec line,
  but a real promise of this feature, so it gets the same backpressure

Judged at the crit, not testable:

- "models a slice of a real ANU system you actually deal with" — whether this
  is a genuine gap, not a fake one
- "you can account for how you directed, grounded and corrected the work" —
  process, argued live

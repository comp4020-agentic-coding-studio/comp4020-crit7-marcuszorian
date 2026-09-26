# Plan: data model & compatibility scoring

Split out of [`PLAN.md`](PLAN.md) because the schema and the scoring
formula are one coupled decision — the tag and availability tables exist
specifically to make "who's compatible with whom" a computable, testable
question instead of something only a human can judge.

## Tables

`cards` (replaces the starter's `messages` table):

| column       | type | notes                                          |
| ------------ | ---- | ---------------------------------------------- |
| `id`         | int  | primary key, autoincrement                     |
| `name`       | text | required                                       |
| `contact`    | text | required, e.g. an email or Discord handle      |
| `courseCode` | text | required, normalized (uppercased, spaces stripped) rather than a fixed dropdown — ANU has hundreds of course codes, too many to enumerate, but "COMP4020" vs "comp 4020" would otherwise fragment nothing (course code isn't used in scoring, only shown) |
| `idea`       | text | required, `maxlength="280"` — free text, for a human reader only, never used in scoring |
| `createdAt`  | text | default `datetime('now')`                      |

`cardTags` (join table, many tags per card):

| column   | type | notes                                  |
| -------- | ---- | --------------------------------------- |
| `cardId` | int  | references `cards.id`                   |
| `tag`    | text | one of the fixed tag vocabulary, below  |

`cardBlocks` (join table, many availability blocks per card):

| column   | type | notes                                     |
| -------- | ---- | ------------------------------------------ |
| `cardId` | int  | references `cards.id`                     |
| `block`  | text | one of the fixed block vocabulary, below  |

A card needs **at least one** row in each join table — enforced by the
`/api/cards` handler, not the schema (SQLite has no easy "at least one
child row" constraint).

## Controlled vocabularies

Both are checkbox groups in the form, never free text — the same reasoning
as a building/cuisine `<select>` in a directory app: free text fragments
the exact overlap computation this feature depends on.

- **tags** (pick a small, recognisable set of project/study topic areas):
  `web`, `mobile`, `ml-data`, `systems-infra`, `game-dev`, `hardware-iot`,
  `theory-math`, `other`
- **blocks** (weekday × period, chosen over calendar dates or free time so
  overlap is a plain set intersection): `mon-am`, `mon-pm`, `mon-eve`,
  `tue-am`, `tue-pm`, `tue-eve`, `wed-am`, `wed-pm`, `wed-eve`, `thu-am`,
  `thu-pm`, `thu-eve`, `fri-am`, `fri-pm`, `fri-eve`, `weekend`  (16 values)

## Scoring

For two cards A and B:

```
tagJaccard(A, B)  = |tags(A) ∩ tags(B)| / |tags(A) ∪ tags(B)|
sharedBlocks(A, B) = |blocks(A) ∩ blocks(B)|

score(A, B) = 100 * tagJaccard(A, B) + 10 * sharedBlocks(A, B)
```

Tags use Jaccard (normalized) because posting more tags shouldn't by
itself inflate a match — two cards that agree on 1 of 1 tags each are a
tighter fit than two that agree on 1 of 5. Availability uses a raw shared
count, not normalized — more overlapping free time is strictly easier to
actually meet up in, regardless of how many blocks either person listed
overall.

**A pair with zero shared tags AND zero shared blocks is excluded from
matches entirely** — not just ranked last. "Compatible" means some real
overlap exists; a score of exactly 0 isn't a weak match, it's not a match.

`matchesFor(cardId, limit)` in `src/lib/db.ts` computes this against every
other card at request time and returns the top `limit`, highest-scored
first, ties broken by lowest `id` (stable, no need for a secondary
tiebreak field).

## Worked example

Four sample cards:

| card | tags                  | blocks                    |
| ---- | --------------------- | -------------------------- |
| A    | `web`, `ml-data`       | `mon-am`, `wed-pm`, `fri-am` |
| B    | `web`                  | `mon-am`, `tue-eve`         |
| C    | `ml-data`, `theory-math` | `wed-pm`, `thu-am`        |
| D    | `game-dev`             | `fri-am`                    |

Scores:

- `score(A, B)`: tags `{web,ml-data} ∩ {web}` = 1, union = 2 → Jaccard 0.5
  → 50. Blocks: shared = `{mon-am}` = 1 → 10. **Total 60.**
- `score(A, C)`: tags `{web,ml-data} ∩ {ml-data,theory-math}` = 1, union =
  3 → Jaccard ≈ 0.333 → ≈33.3. Blocks: shared = `{wed-pm}` = 1 → 10.
  **Total ≈43.3.**
- `score(A, D)`: tags share nothing (Jaccard 0). Blocks: shared =
  `{fri-am}` = 1 → 10. **Total 10** — still a match (one shared block is
  real overlap), just a weak one.
- `score(B, C)`: tags share nothing, blocks share nothing. **Excluded —
  not a match at all**, even though both exist on the board.
- `score(B, D)`: tags share nothing, blocks share nothing. **Excluded.**
- `score(C, D)`: tags share nothing, blocks share nothing. **Excluded.**

So `matchesFor(A)` → `[B (60), C (43.3), D (10)]`; `matchesFor(B)` →
`[A (60)]` only; `matchesFor(D)` → `[A (10)]` only.

`spec/matches.test.ts` asserts this shape: post cards resembling A/B/C/D,
confirm B and C never appear under each other, and confirm A appears
(ranked above C) under B.

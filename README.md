# Study/project compatibility board

A board where ANU students post a short card (name, contact, course code, a
one-line idea, a few topic tags and the weekly time blocks they're free) and
see, under every card, the other people they're actually compatible with,
ranked by score rather than dumped in one long list. It's for the moment
every group-project course has, when you need a partner or a study group and
the only tools are a course forum thread or a Discord channel where posts
scroll away and nobody can tell who overlaps with whom.

**On "ANU system":** the brief points at systems like enrolment, timetabling
or room booking. This board models a different slice of university life: the
informal, unofficial part of forming groups around a course. That's a
deliberate stretch of the framing, not an accident. Group formation is a real
process every student goes through each semester, and it has no official
system at all, which is exactly the gap this fills.

## What good looks like here

Good means **the ranking is something you could check by hand**. A match is
only worth showing if you can say why two people match, so matching is a
small, explicit formula over structured data, not a vibe:

```
score(A, B) = 100 × |tags(A) ∩ tags(B)| / |tags(A) ∪ tags(B)|
            +  10 × |blocks(A) ∩ blocks(B)|
```

- **Tags use Jaccard (normalised).** Ticking every tag shouldn't make you
  everyone's best match. Two people who each picked one tag and agree on it
  are a tighter fit than two who picked five and share one.
- **Availability is a raw shared count.** More overlapping free time is
  simply easier to meet in, however many blocks either person listed.
- **Zero overlap is not a match.** A pair with no shared tag *and* no shared
  block is left out entirely, not ranked last. "Compatible" means some real
  overlap exists.
- **Ties go to the earlier card** (lowest id), so the order is stable between
  reloads.

That formula is why the data looks the way it does. Tags come from a fixed
set of eight (`web`, `mobile`, `ml-data`, `systems-infra`, `game-dev`,
`hardware-iot`, `theory-math`, `other`) and availability from sixteen
blocks (weekday × morning/afternoon/evening, plus `weekend`). Both are
checkboxes, never free text, because free text would split the very overlap
the score depends on ("ML" vs "machine learning" would never match). Course
codes are free text, since ANU has too many to list, but they're normalised
(`comp 4020` → `COMP4020`). They're only shown, never scored. The idea line
is for a human reader only and never scored either. The full design,
including a worked four-card example, is in `PLAN-matching.md`.

The board is seeded with eight sample cards on first boot, so a first visit
shows real matches instead of an empty page.

### Deliberately not built

- **No accounts or login.** Anyone can post, and the contact field is how
  people reach each other. That's enough to test whether the matching is
  useful.
- **No editing or deleting cards.** Posts are append-only.
- **No NLP or semantic similarity on the idea text.** It would make scores
  impossible to explain or test, which cuts against the whole point above.
- **No live updates on the page.** The server broadcasts each new card on
  `/api/events` (and the spec checks it does), but the board doesn't
  subscribe to that stream yet. Reload to see new cards and updated matches.

### What's enforced vs. what's judgement

Enforced by `spec/` on every `pnpm check`, against the built server:

- a posted card survives a reload with its contact, idea, tags, blocks and
  normalised course code visible (`spec/matches.test.ts`)
- the worked example from `PLAN-matching.md`: the right pairs match, fully
  disjoint pairs never appear under each other, and A's matches come out in
  score order B, then C, then D
- a card missing a required field, with no tags, with no blocks, or with an
  unrecognised tag is rejected with a `400` and never saved
- a new card is broadcast over the SSE stream
- the shipped invariants on every page: one `h1`, a nav landmark, a language,
  a title, a viewport, and a clean automated accessibility pass (axe, minus
  the colour and layout rules jsdom can't check) (`spec/invariants.test.ts`)
- this README is served in full at `/readme/` (`spec/readme.test.ts`)

Judgement calls, which the tests don't pin down:

- the weights themselves (100 for tags, 10 per shared block). The spec
  checks the ranking order, not the exact numbers, so the weights can be
  retuned without rewriting tests
- which tags and blocks make up the vocabulary
- whether the ranking actually feels right to a student reading it; only
  people using it can judge that
- rejecting unrecognised block values, the 280-character idea limit, and the
  seed data are all implemented but not covered by a test

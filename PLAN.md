# Plan: what's left before the crit 7 cutoff

Audit taken 2026-09-26 against the published brief
([`crits/07-anu-system`](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/07-anu-system/),
marked **draft** — re-read it the week of the crit before shipping in case it
changed) and [assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/).
The feature itself (study/project compatibility board, `PLAN-matching.md`) is
built and `pnpm check` is green — everything below is what still stands
between that and a submission the cutoff sweep counts as shipped.

## Where this actually stands right now

- **Nothing from this build is committed.** `git status` shows the whole
  compatibility-board feature — schema, migration, `db.ts`, both API routes,
  `index.astro`, `styles.css`, the SSE restore, `spec/matches.test.ts`, the
  `checks.yml` revert — as uncommitted working-tree changes on top of `00521e9
  Revert to the starter template baseline`. `CLAUDE.md` itself is also
  uncommitted (diverged from the `Initial commit` version).
- **The live `*.fly.dev` URL is stale.** It currently serves the *campus food
  finder* prototype (an earlier, since-abandoned build) — `curl` shows
  `<h1>Campus food finder</h1>` — deployed by hand while the repo was private,
  before that work was reverted. It does not reflect any commit currently at
  `HEAD`, let alone this session's work.
- **The repo is still private** (`gh repo view` → `isPrivate: true`). CI's
  `check` and `deploy` jobs both gate on `!github.event.repository.private`,
  so nothing has actually run them yet — the three prior workflow runs all
  show `skipped`.
- **`README.md` and `PROCESS.md` are still the unedited template** — both
  still contain their `<!-- TEMPLATE: ... -->` comments.
- **`reflections/crit-7.md` doesn't exist.** The repo name
  (`comp4020-crit7-marcuszorian`) fixes that exact filename —
  `scripts/check-evidence.ts` derives it from the name alone.
- **One housekeeping item from the brief is already satisfied**: the course
  plugin bug (Fly app name misread when a GitHub username has capitals,
  fixed in `0.14.21`) — the installed plugin is already `0.14.21`, so no
  action needed there.

## Remaining work, in the order to do it

Each step is real work, not a formality — do them in this order because later
steps depend on earlier ones (you can't cite a commit that doesn't exist yet;
you can't write a truthful "what shipped" README before the code is settled).

### 1. Commit the compatibility-board build, incrementally

The brief's explicit checklist wants "commits that grew with the work," and
`PROCESS.md`'s citations need real SHAs to point at — so this has to happen
before step 4. Split into logical commits rather than one dump, e.g.:
- schema + migration together (per `CLAUDE.md`'s atomic-schema rule) —
  `schema.ts`, `drizzle/0001_shallow_husk.sql`, `drizzle/meta/*`
- `db.ts` (matching/scoring/persistence) + `spec/matches.test.ts`
- the API route + page + styles
- the SSE restore + its test + the `checks.yml` revert (this session's
  separate piece of work)
- `CLAUDE.md`'s own update, on its own, since it's the harness record

Push each as it lands rather than holding them for one late push — the brief
explicitly checks for an incremental trail, not just a green final state.

### 2. `README.md`

Replace the template: what the compatibility board is, in a paragraph; then
"what good looks like here" — what counts as a match and why (Jaccard on
tags + shared blocks, zero-overlap pairs excluded), what's a deliberately cut
corner (`PLAN.md`'s old "out of scope" list — no accounts, no edit/delete, no
NLP similarity — capture that intent here even though this file no longer
holds it), and which parts are enforced by `spec/` vs. just judgement calls.
`spec/readme.test.ts` checks `/readme/` serves this file's content in full —
run `pnpm check` after to confirm.

### 3. `PROCESS.md`

150–300 words, written after step 1's commits exist so citations resolve.
Cover: what was built, the tests-first/atomic-schema discipline from
`CLAUDE.md`, the SSE-stream retire-then-restore correction as a concrete
example of a real correction (the CI edit was reverted because it silently
broke a still-live contract), cite commit hashes as
`[`sha`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/sha)`
links. `scripts/check-evidence.ts` fails the build if the template comment is
still present, if no citation is found, or if a cited SHA doesn't resolve —
run `pnpm check:evidence` locally before trusting this is done.

### 4. `reflections/crit-7.md`

New file, 150–300 words, answering the two standing prompts from
`reflections/README.md`: the breakthrough that moved the work forward, and
what this week changed about who you want to be as a developer. Not part of
the deployed site — checked only by filename.

### 5. Verify locally before shipping

```
pnpm check           # typecheck + spec suite
pnpm check:evidence  # PROCESS.md template gone, citations resolve, reflection present, CLAUDE.md present
```

### 6. Ship

Use the `/ship` skill to flip the repo public — this is what actually turns
on CI's `check` and `deploy` jobs (both currently `skipped`). Confirm after
flipping:
- the `check` job goes green in Actions (not skipped)
- the `deploy` job runs `flyctl deploy` and goes green, including its own
  in-CI checks: site returns `200`, same-origin POST isn't `403` (https
  detection), cross-site POST *is* `403` (CSRF still on), internal links
  resolve
- the live `*.fly.dev` URL now serves the compatibility board, not the stale
  campus-food-finder build — reload after posting a card and confirm it's
  still there (the brief's explicit persistence check)

### 7. Final check against the brief's explicit cutoff checklist

- [ ] app loads at its `*.fly.dev` URL
- [ ] models a real slice of a system you deal with, wired end to end
  (course/study matching — arguably a stretch of "ANU system" vs.
  enrolment/timetabling/booking; worth a line in `README.md` owning that
  framing rather than leaving it implicit)
- [ ] the core flow persists across a reload
- [ ] commit history shows incremental growth, `PROCESS.md` present, sole
  reflection at `reflections/crit-7.md`
- [ ] `CLAUDE.md` committed and reflects how the work actually went

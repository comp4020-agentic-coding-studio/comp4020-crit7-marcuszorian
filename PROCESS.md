# Process overview

## What I built

A study/project compatibility board: post a card with topic tags and free
time blocks, and the board ranks other cards by overlap. `README.md` covers
what counts as a match and why.

## How I got here

I first built a campus food finder, then abandoned it and reverted to the
starter ([`00521e9`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/00521e9)).
The board started as a written design,
[`PLAN-matching.md`](PLAN-matching.md)
([`ccb1d66`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/ccb1d66)),
before any code. The schema change and its `pnpm db:generate` migration went
in as one commit
([`fe5b4ee`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/fe5b4ee)).
Matching and persistence came next, with `spec/matches.test.ts` pinning
the scoring and the rule that pairs with no overlap are left out
([`86edd8c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/86edd8c)).

To be honest about the record: I built the feature before committing any of
it, then split it into logical commits afterwards. That is why the
timestamps cluster together, and why each test shares a commit with its
implementation. The history can't show that tests came first.

The real correction was the live-update stream. My first draft retired the
guestbook's SSE endpoint and edited the CI workflow to stop curling
`/api/events`. That edit silently broke a contract the starter's deploy check
still enforced. I reverted the CI edit, so the workflow is unchanged in
history, and restored the stream to broadcast cards, with a spec test
([`f2db71e`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/f2db71e)).
That lesson, along with tests-first and atomic schema changes, went into
`CLAUDE.md` as standing rules
([`57e1f8d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/57e1f8d)).

What's verified: `pnpm check` (typecheck plus spec suite) passes locally. The
deployed app has not been checked yet.

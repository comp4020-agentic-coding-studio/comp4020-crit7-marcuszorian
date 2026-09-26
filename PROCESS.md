# Process overview

## What I built

A study/project compatibility board: post a card with topic tags and free
time blocks, and the board ranks other cards by overlap. `README.md` covers
what counts as a match and why.

## How I got here

After abandoning a campus food finder
([`00521e9`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/00521e9)),
the board started as a written design,
[`PLAN-matching.md`](PLAN-matching.md), before any code. The schema and its
migration went in as one commit
([`fe5b4ee`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/fe5b4ee)),
then matching with `spec/matches.test.ts`
([`86edd8c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/86edd8c)).

To be honest about the record: I built that first feature before committing
any of it, so each test shares a commit with its implementation. Later work
did land tests first, e.g. the course code suggestions
([`c172c03`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/c172c03)).

## Corrections

My first draft retired the guestbook's SSE endpoint and edited CI to stop
curling `/api/events`, silently breaking a contract the deploy check still
enforced. I reverted the CI edit and restored the stream, now broadcasting
cards
([`f2db71e`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/f2db71e)).
That lesson went into `CLAUDE.md` as a standing rule
([`57e1f8d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/57e1f8d)).

The UI redesign's availability grid assumed every block was `<day>-<slot>`
and crashed on `weekend`, the one that isn't. The suite caught it before
commit (the built server returned 500), and the grid now gives leftover
blocks their own chip
([`6ca57ea`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-marcuszorian/commit/6ca57ea)).

What's verified: `pnpm check` (typecheck plus spec suite) passes locally. The
deployed app has not been checked yet.

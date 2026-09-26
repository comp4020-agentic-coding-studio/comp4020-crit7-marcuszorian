# Working method for this build

Nothing about the starter is recorded here. What the repo ships is explained
where it lives --- `fly.toml`, the `Dockerfile`, the CI workflow and
`spec/README.md` each say what they fix --- and the
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec. Read them before planning or
building anything new.

The build itself follows [`PLAN.md`](PLAN.md) and
[`PLAN-matching.md`](PLAN-matching.md). Rules for how the agent works on it:

- **Tests first.** Any new spec promise (a persistence contract, a matching
  contract) gets a failing test in `spec/` before the implementation that
  makes it pass. Don't write the feature and the test in the same breath.
- **Schema changes are atomic.** Every `schema.ts` edit is committed together
  with its `pnpm db:generate` output --- never hand-edit files under
  `drizzle/`, never leave a schema change committed without its migration.
- **No silent scope changes.** If a step in `PLAN.md` turns out to need a new
  table, route, or dependency the plan didn't call for, stop and ask before
  building it --- don't quietly expand scope and mention it afterward.
- **Shipped plumbing isn't exempt from scrutiny.** The starter's CI workflow,
  `fly.toml`, and `Dockerfile` are fixed, but "fixed" doesn't mean "still
  correct" once the app underneath them changes. The first draft of this
  project retired the guestbook's live-update stream and missed that the CI
  deploy job still curled `/api/events` to verify one was running --- that
  would have failed the moment the repo went public. When retiring a
  starter feature, check what else (CI, docs, other routes) still assumes
  it exists, rather than trusting the starter's checks are still accurate.
- **State what was actually verified.** "`pnpm check` passes" means
  typecheck plus the test suite ran green --- say that, not "everything
  works." A green suite is backpressure, not proof the deployed app is
  correct.
- **Log real prompts and real corrections in `PROCESS.md` as the work
  lands**, not reconstructed from memory afterward.

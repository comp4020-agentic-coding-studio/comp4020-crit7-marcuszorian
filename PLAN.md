# Plan: what's left before the crit 7 cutoff

Audit taken 2026-09-26 against the published brief
([`crits/07-anu-system`](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/07-anu-system/),
marked **draft** — re-read it the week of the crit before shipping in case it
changed) and [assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/).
The feature itself (study/project compatibility board, `PLAN-matching.md`) is
built and `pnpm check` is green — everything below is what still stands
between that and a submission the cutoff sweep counts as shipped.

## Where this actually stands right now

_Status refreshed 2026-09-26, after steps 1–4 landed._

- **Steps 1–4 are done and pushed.** The build went in as incremental
  commits: schema + migration (`fe5b4ee`), matching + spec (`86edd8c`),
  route + page (`8467b6f`), SSE restore (`f2db71e`), CLAUDE.md + this plan
  (`57e1f8d`), README (`42f3ea1`), PROCESS.md (`47baa3b`), reflection
  (`0540772`). CI ran on each push but every run shows `skipped` because
  the repo is private.
- **Steps 5–7 are still open.** Nothing has been verified by CI yet and the
  repo hasn't been shipped.
- **The live `*.fly.dev` URL is stale.** It currently serves the *campus food
  finder* prototype (an earlier, since-abandoned build) — `curl` shows
  `<h1>Campus food finder</h1>` — deployed by hand while the repo was private,
  before that work was reverted. It does not reflect any commit currently at
  `HEAD`, let alone this session's work.
- **The repo is still private** (`gh repo view` → `isPrivate: true`). CI's
  `check` and `deploy` jobs both gate on `!github.event.repository.private`,
  so nothing has actually run them yet — the three prior workflow runs all
  show `skipped`.
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

---

# Plan: UI overhaul in the course website's style

Added 2026-09-26. The board works but looks like the starter: `system-ui`,
a 40rem column, grey `#ddd` boxes, blue links, pill tags. Goal: make it read
as a sibling of the
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
— same tokens, type, layout grid and component shapes — without changing
what the app does or any contract `spec/` holds it to.

## What the course site actually uses

Pulled from its served CSS (`_astro/components.*.css` plus the inline ANU
theme `<style>` in the page head), not guessed from screenshots:

- **Tokens** are CSS custom properties prefixed `--at-*`, in
  `@layer at.tokens, at.base, at.components`, with light/dark handled by
  `light-dark()` (so `color-scheme: light dark` on `:root`).
- **ANU theme overrides:** `--at-primary: #be830e` (gold, hover `#d4940f`,
  active `#a87309`), `--at-secondary: #be4e0e` (copper), `--at-tertiary:
  #0085ad` (teal), **`--at-border-radius: 0`** (square corners everywhere),
  link colour `light-dark(#9a6b0b, var(--at-primary))` — darker gold in
  light mode for contrast. Backgrounds/text are warm neutrals at hue 75:
  `--at-bg: light-dark(oklch(99.4% .004 75), oklch(12% .008 75))`,
  `--at-bg-alt` 96.5%/15%, `--at-text` 20%/95%, secondary/muted text as the
  same colour at 78%/62% alpha, `--at-divider` at 12% alpha.
- **Type:** Public Sans (variable, 100–900) for body, Roboto Mono for code;
  base size `1.125rem`, line-height 1.6; headings use `--at-heading`
  (= primary gold), line-height 1.25, `text-wrap: balance`; `h1` 2.5rem
  weight 400 letter-spacing −0.02em, `h2` 1.875rem, `h3` 1.375rem.
- **Spacing scale:** xs .25 / sm .5 / md 1 / lg 1.5 / xl 2 / 2xl 4 rem.
- **Layout:** a named-line grid — `[full-start] gutter [content-start]
  min(48rem, …) [content-end] gutter [full-end]` — so bands (nav, hero,
  footer) span `full` while prose sits in `content`.
- **Components:** sticky top nav (brand left, small secondary-text links,
  `--at-bg` background); `.at-card` = 1px `--at-divider` border, square,
  `--at-spacing-md` padding, hover tints to `--at-accent-soft` (primary at
  10%/14%) with `--at-shadow-sm`; `.at-callout` = soft accent background
  with a 1px accent top border; buttons solid primary with auto-contrast
  text (`--at-on-accent`), `--outline` / `--ghost` variants; inputs full
  width, 1px divider border, focus → accent border + 2px accent outline;
  checkboxes 1.125rem with `accent-color`; footer = divider top border,
  muted small text, then a black band.
- **Hero:** full-bleed image with a dark gradient and a large white title
  (`clamp(2rem, 5vw, 4.5rem)`). We have no illustration, so we adopt the
  *band* shape (full-width `--at-bg-alt` strip, big title) rather than
  inventing art.

**Deliberately not copied:** the ANU logos/lockups, crest, partner logos,
Acknowledgement/TEQSA/CRICOS footer text. This is a student app, not an ANU
page — it borrows the visual language, not the institutional identity.

## Contracts the redesign must not break

- `spec/matches.test.ts` finds cards as `article.card` with the name in an
  `h2`, and reads match rows from `.matches li` (text contains the match's
  name and score). Keep those selectors and that text; restyle around them.
- `spec/invariants.test.ts` on `/` and `/readme/`: a `nav`, exactly one
  `h1`, `lang`, real `<title>`, viewport meta, alt text, zero axe
  violations. A new shared layout must keep one `h1` per page (the README
  page's `h1` comes from `README.md` itself — the layout must not add one).
- `spec/readme.test.ts`: `/readme/` contains all of `README.md`'s text.
  Styling and wrappers are fine; don't truncate or restructure content.
- Form field `name`s (`name`, `contact`, `courseCode`, `idea`, `tags`,
  `blocks`) and their values — `/api/cards` parses exactly these.
- axe in jsdom **skips colour contrast**, so a green suite says nothing
  about the gold palette's legibility. Contrast is checked by hand (below).

## Decisions (confirmed 2026-09-26: fonts (a), dark mode via `light-dark()`, add `Base.astro`)

1. **Fonts.** Public Sans / Roboto Mono are the site's look. Options:
   (a) add `@fontsource-variable/public-sans` (+ `roboto-mono`) — self-hosted,
   no third-party request, but **a new dependency**; (b) a Google Fonts
   `<link>` — no dependency, but an external request on every load;
   (c) system stack only, accept the difference. Recommendation: (a).
2. **Dark mode.** Follow `prefers-color-scheme` via `light-dark()` (pure
   CSS, no JS) — recommended. A manual toggle like the course site's needs
   a client script and `localStorage`; only if asked.
3. **Shared layout component.** Add `src/layouts/Base.astro` (head, nav,
   footer, slot) used by both pages. It's a new file but not a new route,
   table, or dependency — flagging it anyway since it restructures both
   pages.

## Steps

### 1. Tokens and base layer — `src/styles.css`

Rewrite the stylesheet in the site's layer order:
- `@layer tokens` — the `--at-*`-equivalent variables above (keep the same
  names minus the prefix, or keep `--at-` for grep-ability; pick one and
  stay consistent), ANU gold/copper/teal overrides, radius 0, spacing and
  type scales, shadows, `color-scheme: light dark`.
- `@layer base` — body font/size/line-height/colours on `--bg`; heading
  colours and scale; links (`--link`, underline offset, hover); the
  named-line page grid; `:focus-visible` ring in accent; form control
  defaults (inputs, textarea, checkboxes, fieldset, legend) exactly as the
  site styles them; `code` in mono on `--code-bg`.
- `@layer components` — nav, hero band, card, chip, callout, button,
  footer (below). Remove the old blue/grey rules entirely.

### 2. Shared layout — `src/layouts/Base.astro`

Props: `title`. Renders `<html lang="en-AU">`, head (charset, viewport,
title, font import, stylesheet), a **skip link** to `#main`, the sticky
`<nav aria-label="site">` with a text wordmark ("Study/project matches")
and links **Board** / **About** with `aria-current="page"` on the active
one, `<main id="main">` + `<slot />`, and a footer (course code, "a
COMP4020 crit 7 prototype", link to the repo). Fixes the stale
**"Guestbook"** nav label still in `readme.astro`.

### 3. Board page — `src/pages/index.astro`

- **Hero band** (full-width `--bg-alt` strip): the page's single `h1`, the
  one-paragraph intro as a lead, and a short stat line ("N cards · M
  matching pairs") computed from data already loaded.
- **Two-column layout** at ≥ 64rem: sticky "Post a card" panel on the left
  (a callout-style box), board on the right; stacks on mobile with the form
  first. (Widen content beyond the site's 48rem for this page only.)
- **Form polish:** name/contact/course code in a responsive row; idea
  textarea with a live `n/280` counter (tiny progressive-enhancement
  script, form works without it). Topics as **toggle chips** — the
  checkbox stays in the DOM (visually hidden but focusable, label is the
  chip), checked = solid gold. Availability as a **weekday × am/pm/eve
  grid** of checkboxes (rows Mon–Fri, columns Morning/Afternoon/Evening)
  instead of 15 loose labels, with each cell's accessible name the full
  block ("Monday morning"); values stay `mon-am` etc. Solid primary submit
  button.
- **Cards** (`article.card`, kept): square `.at-card` look; `h2` name;
  course code as a mono badge; contact as secondary text; idea as body;
  tags as outline chips, availability as small teal chips rendered with
  human labels ("Mon AM"). **Matches** section in the card footer: each
  `li` shows the match name and a score bar/badge (keep the numeric
  `score.toFixed(1)` in the text); empty state as a muted line.
- **Empty board state:** a callout ("No cards yet — post the first one")
  instead of an empty section.
- Card grid: single column in the board pane (cards are text-heavy);
  revisit two columns only if it reads well.

### 4. README page — `src/pages/readme.astro`

Switch to `Base.astro`; wrap the rendered markdown in a `.prose` container
styled like the course site's topic pages (48rem measure, heading anchors
not needed, tables with gold header + stripe, code blocks in mono on
`--code-bg`). Content untouched.

### 5. Optional: live updates on the board

The SSE stream (`/api/events`) already broadcasts new cards, but the page
has no client consuming it. A small `EventSource` script could show a
"New card posted — refresh" toast. **Out of scope unless asked** — it's a
feature, not styling.

### 6. Verify

- `pnpm check` — typecheck + suite green (matches, invariants incl. axe,
  readme). Report exactly that, not "UI works".
- **Contrast by hand** (axe-in-jsdom doesn't): gold `#be830e` on the light
  bg is ≈ 3:1 — fine for large headings and borders, **not** for body text
  or small chip labels; use the darker link gold `#9a6b0b` (or text colour)
  for small text on light, and check white-on-gold button text meets 4.5:1
  (fall back to dark text, as the site's `--on-accent` formula does).
  Check both light and dark schemes.
- Keyboard pass: skip link, tab through chips and availability grid,
  visible focus everywhere, form submits with Enter.
- Run the app (`pnpm build && pnpm preview`) and screenshot `/` and
  `/readme/` at ~400px and desktop, light and dark, side by side with the
  course site.
- Shipped plumbing check (CLAUDE.md): the CI deploy job's in-CI checks
  (200 on `/`, same-origin POST not 403, cross-site POST 403, internal
  links resolve) — make sure new nav/footer links all resolve and nothing
  the job curls moved.

### 7. Commit and log

Small commits: tokens/base CSS; layout component + readme page; board
page restructure; form controls (chips + grid); cards/matches styling.
Log the prompt and any corrections in `PROCESS.md` as they happen.

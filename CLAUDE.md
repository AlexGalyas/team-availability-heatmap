# Project Memory (CLAUDE.md) — Frontend

> Read this every session. Harness workflow is in `WORKFLOW.md`; per-feature state
> lives in `docs/specs/<slug>/STATE.md`.

## Stack
- pnpm. Package manager is **pnpm** — never npm/yarn.
- Next.js (App Router) + React + TypeScript. Single project at the **repo root**.
- Styling: **SCSS Modules** (`*.module.scss`). Heavy use of shared mixins, variables,
  and reusable partials. No Tailwind, no CSS-in-JS.
- Global state: **Redux Toolkit**. Client-side data/caching/mutations: **RTK Query**.
- Server / initial data: **Server Components + route handlers**.
- Forms & validation: **Formik + Yup**.
- Tests: Vitest + React Testing Library (component/hook), Playwright (e2e).

## Commands (always use these)
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Unit/component tests: `pnpm test`
- E2E: `pnpm test:e2e`
- Build: `pnpm build`
- Phase gate (before declaring any task done): `bash scripts/gate.sh`

## Project structure
- **Feature-based / by domain**: group code by feature, not by file type. Co-locate
  a feature's components, hooks, styles (`*.module.scss`), and tests together.

## Conventions (summary — full version in docs/constitution/)
- TypeScript strict. **No `any` — ever.** If a type is hard, model it properly or use
  `unknown` + narrowing, never `any`.
- Server vs Client Components: pragmatic, decided per feature. Prefer Server Components
  for static/data-driven UI; reach for `"use client"` when interaction, state, effects,
  or browser APIs require it.
- Data:
  - Initial / server-rendered data → Server Components + route handlers.
  - Client-side fetching, caching, mutations → RTK Query.
  - Other global client state → Redux Toolkit slices.
- Forms: Formik for form state, Yup for schema validation. Show field-level errors.
- Styling: SCSS Modules. **Reuse existing mixins/variables before adding new ones.**
  A component's styles live in its co-located `*.module.scss`. No magic numbers —
  use variables.
- Every UI surface handles four states explicitly: loading, empty, error, success.
- **Accessibility is a requirement**: semantic HTML, labelled inputs, keyboard
  navigation, visible focus, ARIA only where genuinely needed.
- No business logic in components — extract to hooks or plain functions.
- Tests: cover **critical components and logic-bearing hooks** (Vitest + RTL); cover
  **critical user flows** with Playwright e2e. Skip trivial presentational components.
  A task touching critical logic is not done until its tests exist and `gate.sh` is green.

## Harness rules (across sessions)
- One context window = one phase. Don't try to finish a feature in one session.
- Before any `/clear`: write `STATE.md` via `/handoff`.
- On session start for an in-progress feature: read `STATE.md` first (`/resume`).
- Implement only the next unchecked task in `tasks.md` per `/next`.
- Never mark a task done without a green `bash scripts/gate.sh`.
- Delegate bulk file reading/search to a sub-agent; keep the main context for decisions.

## What NOT to do
- Don't use `any`. Don't introduce Tailwind or CSS-in-JS — styling is SCSS Modules.
- Don't fetch initial data client-side that should be server-rendered.
- Don't ship a surface without its loading/empty/error states.
- Don't add a dependency without noting why in STATE.md.
- Don't leave `console.log` or commented-out code in a commit.

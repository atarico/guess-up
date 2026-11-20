# Guess-Up — project instructions

## What this repository is

A take-home technical test for **RUUT** (Fullstack role). The brief, in one line: *"Build an app to see stock financial data. What it does is up to you."* The repository is public and doubles as a portfolio piece.

What the reviewers look at, in their order of priority:

1. **Spec-driven work with AI.** How an idea became a spec, how the spec guided the agent, how the output was reviewed. Judgment matters more than volume of code.
2. **Product judgment and usability.** There is no feature list on purpose. Who it is for, what was left out, how it feels on a phone.
3. **Code the author can explain.** The next interview is a walkthrough, a code review of this repo and these prompts, and a small live change. Every line must be explainable by the author, whoever wrote it.

Effort stated in the brief: about 3 hours ("a guide, not a timer"; overruns get explained in the README). Due date: 20 November 2026.

## Fixed by the brief — not negotiable

- Market data comes from a **free public API, through our backend**. The browser never calls the provider.
- **JWT authentication** between frontend and backend.
- **Backend and frontend both deployed**, each with its own public URL, live at submission.
- A **`/prompts` folder** with every prompt used, in order (structure below).
- A **README** with: how to run locally, architecture, key decisions and trade-offs, time spent, what would come next, plus what was built, what was left out, and why.
- A test user and password, or open sign-up (we ship both).

## The product in five lines

Guess-Up shows one year of a real stock chart with the name, dates and price scale removed. The user answers one question: buy or pass. The app then reveals the company, the dates and what happened over the next three months. Over time it compares the user's picks against buying every chart and against a coin flip. The point is an honest feedback loop for beginners who believe they can read charts.

**Source of truth for scope and behaviour** — read the relevant one before working on that area:

- `prompts/specs/01-product.md` — user, rules of a round, scoring definitions, scope (P0 / P1 / out)
- `prompts/specs/02-backend.md` — schema, API contract, market-data client, rate-limit budget
- `prompts/specs/03-frontend.md` — screens, states, copy, chart behaviour

If the code needs to deviate from a spec, change the spec in the same commit and add a line to `DECISIONS.md`. A silent deviation is a bug.

## Languages

Interface copy is neutral Spanish for users in Mexico (tú form, never voseo: no "comprá", "mirá", "tenés", "podés"; `es-MX` dates and numbers; prices as `USD 184.20`, never a bare `$`, never converted to pesos), with the exact wording in `03-frontend.md`. Specs, code, identifiers, comments, commit messages, API error messages, the README and `DECISIONS.md` are English. Session logs keep the author's prompts in the language they were written in.

## Product invariants

These hold in every change. Breaking one breaks the product, not just a feature.

1. **No future leak.** Before a decision is recorded, a response about a round contains only the round id, the normalised points and the `resumed` flag (true when an already open round is returned). No symbol, name, dates, prices or volume, in any field, header or error message. The contract test that checks this is never deleted or weakened.
2. **No rerolls.** One open round per user, enforced in the database. Asking for a new round while one is open returns the open one. Decisions are immutable.
3. **The game never waits on the provider.** Creating a round, deciding and reading stats touch Postgres only. The live quote is a separate, optional call that is allowed to fail.
4. **One door to the provider.** Every Twelve Data request goes through the single client and its credit budget. Tests use the fake provider and never hit the network.
5. **Stats are frozen at creation.** A round stores its forward return when it is created. Stats never recompute from re-fetched prices.
6. **Honest numbers.** Always show the sample size next to a verdict, never round in a way that flips a sign, and label returns as price returns.

## Stack and layout

TypeScript everywhere, strict mode. This is the stack the brief prefers, so no justification is needed in the README beyond one line.

| Part | Choice | Hosting |
| --- | --- | --- |
| Frontend | Next.js (App Router), Tailwind, hand-written SVG chart | Vercel |
| Backend | Express 5, zod, `pg`, `jsonwebtoken`, `bcryptjs` | Render (free web service) |
| Database | Postgres on Supabase, used as plain Postgres (no Supabase Auth, no Data API) | Supabase free |
| Market data | Twelve Data, Basic plan | — |
| Tests | Vitest (+ supertest for routes) | — |

```
backend/     Express API: src/{routes,services,repositories,domain,marketdata,middleware}
frontend/    Next.js app: src/{app,components,lib}
prompts/     README.md, system/, specs/, sessions/   (deliverable)
odd/tasks/   ODD feature documents (committed)
DECISIONS.md running log of trade-offs; feeds the README
```

Two standalone packages, no workspace tooling. API types are mirrored by hand in `frontend/src/lib/api-types.ts`; the contract lives in `02-backend.md`.

Before using a framework API you are not certain about (Next.js, Express 5, Tailwind), check current docs instead of relying on memory.

## Commands

pnpm 10 and Node 24 in both packages. Run each command inside its package folder, and keep this list current.

```
backend/   pnpm dev         tsx watch, loads backend/.env, http://localhost:4000
           pnpm test        Vitest + supertest; no network, no database
           pnpm typecheck   tsc --noEmit over src/ and test/
           pnpm lint        ESLint with typescript-eslint
           pnpm build       tsc to dist/
           pnpm start       node dist/index.js (what Render runs)
           pnpm migrate     applies sql/001_init.sql to DATABASE_URL in one transaction
           pnpm seed        work unit 2
           pnpm seed:demo   work unit 7
frontend/  pnpm dev         next dev, loads frontend/.env.local, http://localhost:3000
           pnpm test        Vitest; the format.ts tests arrive in work unit 5
           pnpm typecheck   next typegen, then tsc --noEmit
           pnpm lint        ESLint with eslint-config-next
           pnpm build       next build
```

## How we work here

This repo is driven with **Gentle-AI ODD**. Gentle-AI's own instructions define the ODD mechanics; this file adds project facts and does not redefine them. On workflow mechanics, follow Gentle-AI. On scope and invariants, this file and the specs win.

- The specs are accepted intent. P0 items in `01-product.md` are authorised scope. P1 items need an explicit go-ahead. Anything not in a spec gets proposed, not built.
- Substantial work keeps its ODD feature document in `odd/tasks/<feature>.md`. Those files are committed: they are part of the evidence the reviewers asked for.
- **TDD is an explicit choice here:** on for `backend/src/domain/**` (round picking, normalisation, stats, coin benchmark, streaks) with an observed RED before GREEN. Elsewhere, proportionate functional checks: typecheck, lint, build, and a manual pass at 390 px width for UI.
- Small Conventional Commits, one work unit each, sized for a human to read.
- Ask before adding a dependency that the specs do not name.
- Deploy early. A deployed skeleton comes before features; the last 20 minutes are not for first deploys.

### Time and scope guard

The budget is roughly three hours of building. Follow the build order in `01-product.md` §15 and stop at the cut lines. When something takes longer than planned, say so and note it in `DECISIONS.md`; the README has to account for time honestly.

### Explainability rule

Prefer boring, explicit code over clever code. No abstraction without a second caller. Name things after the product (`round`, `cutoff`, `forwardReturn`, `edge`). Comment the *why* on anything non-obvious (the budget limiter, the open-round index, the coin benchmark seed). If a block could not be explained aloud in thirty seconds, simplify it.

## Prompt log (a deliverable)

```
prompts/
├── README.md        tools, models, versions, how the work was done
├── system/          copy of this CLAUDE.md and any other rules files
├── specs/           01-product.md, 02-backend.md, 03-frontend.md
└── sessions/        NN-topic.md, prompts sent, in order
```

- When asked to "log this session", write `prompts/sessions/NN-<topic>.md` with: date, tool and model, the user's prompts **verbatim and in order** (original language, no paraphrasing, no tidying), then a section **"What the AI got wrong / what was fixed by hand"**, then the resulting commits.
- Never invent, merge or reorder prompts. If something is missing from context, say so in the file.
- Redact secrets before writing: API keys, JWT secret, database URL, passwords.
- Keep `prompts/system/CLAUDE.md` in sync whenever this file changes.

## Secrets and environment

Never commit secrets, never print them in logs or session files, never put them in frontend code.

- Backend: `DATABASE_URL`, `JWT_SECRET`, `TWELVE_DATA_API_KEY`, `CORS_ORIGIN`, `PORT`, `TRUST_PROXY_HOPS` (proxy hops Express trusts; `0` locally, measured in production, see `02-backend.md` §4), plus `DEMO_EMAIL` and `DEMO_PASSWORD` for the demo seed script
- Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_DEMO_EMAIL`, `NEXT_PUBLIC_DEMO_PASSWORD`
- The demo credentials are the one exception to the rules above: they are public by design, printed in the README and shipped to the browser. The demo account is P0.
- Each package ships a `.env.example` with names only, except non-secret defaults such as `TRUST_PROXY_HOPS=0`.

## Definition of done for a work unit

- Behaviour matches the spec, or the spec was updated with a `DECISIONS.md` entry.
- Typecheck, lint and tests pass; the no-leak contract test is green.
- Invariants above still hold.
- For UI: checked at 390 px width, keyboard reachable, loading and error states present.
- The author could explain the diff without the agent in the room.

## Do not

- Call Twelve Data from the browser, from tests, or outside the single client.
- Return or log anything that identifies an open round's stock or dates.
- Add features, pages, settings or libraries the specs do not ask for.
- Present a figure as financial advice. The app carries a short "not investment advice" line.
- Rewrite history in `prompts/` to make the process look cleaner than it was.

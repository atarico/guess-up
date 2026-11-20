# Guess-Up

**Can you actually read a stock chart?** Guess-Up shows one year of a real US stock chart with the name, the dates and the price scale removed. You answer one question: buy or pass. Then the app reveals the company, the dates and what happened over the next three months. After ten rounds it tells you whether your judgment beat simply buying every chart, and whether it beat a coin.

Built as a take-home technical test for RUUT (Fullstack role), with AI as a pair and a spec-first workflow.

| | |
| --- | --- |
| **App** | https://guess-up-frontend-kappa.vercel.app |
| **API** | https://guess-up-api.onrender.com (`GET /status` to check it is up) |
| **Demo account** | `demo@test.com` / `TODO(author): demo password` (or use the **Probar la cuenta demo** link) |
| **Sign-up** | Open: any email and a password of 8+ characters |
| **Submitted version** | Commit [`f1ba936`](https://github.com/atarico/guess-up/tree/f1ba936), 20 November 2026. What changed after it is in [After the submission](#after-the-submission). |

**Two-minute tour**

1. Open the app and tap **Probar la cuenta demo**.
2. Play one chart: **Comprar** or **Pasar**. The first time, a short guided tour points at each part of the screen; **Saltar** skips it. The reveal that follows is the financial-data view.
3. Tap **Estadísticas** in the top bar. The demo account started with 40 rounds played by a coin, so the verdict is there without playing ten rounds yourself.

> The backend runs on Render's free plan and sleeps after 15 minutes without traffic. The first request can take up to a minute: the app shows a "Despertando el servidor" screen and continues on its own.

> The interface is in neutral Spanish, for users in Mexico. Code, specs and this README are in English.

---

## Contents

1. [What I built and why](#what-i-built-and-why)
2. [How it answers the brief](#how-it-answers-the-brief)
3. [Architecture](#architecture)
4. [Run it locally](#run-it-locally)
5. [Key decisions and trade-offs](#key-decisions-and-trade-offs)
6. [What I left out, and why](#what-i-left-out-and-why)
7. [Known limitations](#known-limitations)
8. [How I worked with AI](#how-i-worked-with-ai)
9. [After the submission](#after-the-submission)
10. [Time spent](#time-spent)
11. [What I would do with more time](#what-i-would-do-with-more-time)

---

## What I built and why

**Who it is for.** The beginner investor who believes they can read charts. They watch videos about chart patterns, have made a few trades, and remember the ones that went well. They use their phone, in short sessions.

**The problem.** This user has no honest feedback loop. The real market takes months to say whether a call was right, and by then the call is forgotten or the story has been rewritten. Stock apps answer with more data; none of them shows the user their own record of decisions made without knowing the future.

**The idea.** Take real price history and remove knowledge of the future:

1. Show one year (252 trading days) of a real stock, with no name, no dates and no price scale. Only the shape.
2. Ask one question: buy or pass. The answer is recorded once and cannot be changed.
3. Reveal the company, the real dates and the next three months (63 trading days).
4. Keep score against the simplest possible strategy, buying every chart, and against a coin.

The sentence the product exists for is on the stats screen:

> *Tus selecciones rindieron +2.1% en promedio. Comprar todas las gráficas rindió +3.4%. Tu criterio te costó 1.3 puntos porcentuales por compra.*

In English: your picks averaged +2.1%; buying every chart averaged +3.4%; your judgment cost you 1.3 percentage points per purchase.

**The scoreboard.** "Your picks" is the average three-month return of the charts you bought. "Buy everything" is the average of every chart you were shown. Their difference is your **edge**. I compare picks against all charts instead of counting a pass as 0%, because otherwise a user in a rising market is punished for passing at all, and the number would mostly measure how often they buy.

**The coin.** To show whether the edge is skill or luck, the app simulates 2,000 coins that buy the same number of charts as you, at random, from the same rounds. It shows the range where 90% of those coins land and where you fall. With few rounds the range is wide, and that width is the lesson. The coin verdict is worded as provisional (*"por ahora"*, so far) and appears only after 10 decided rounds.

**Screens.** Welcome, log in / sign up, Play (which becomes the reveal after the decision) and Stats.

## How it answers the brief

The brief asks for "an app to see stock financial data". Guess-Up shows financial data at the moment it carries the most meaning: right after the user has committed to a prediction. The reveal is the data view:

- ticker, company name, sector and exchange;
- the real dates of the window, the cutoff and the end of the three months;
- fifteen months of real daily prices on the chart;
- the price at the cutoff and three months later, and the three-month return;
- today's live price and the change since the cutoff, from the live API.

The stats screen adds the user's own record: averages, edge, the coin comparison, hit rate, streaks and the last 20 charts.

There is no search box and no watchlist on purpose. Anonymity is the product: knowing the name before deciding destroys the measurement.

## Architecture

```
Browser (Next.js on Vercel)
   │  HTTPS + Authorization: Bearer <JWT>
   ▼
Express API (Render, Virginia) ──── Twelve Data (only through one client)
   │  TLS, certificate verified against Supabase's CA
   ▼
Postgres (Supabase, us-east-1)
```

| Part | Choice |
| --- | --- |
| Frontend | Next.js (App Router), TypeScript strict, Tailwind, hand-written SVG chart |
| Backend | Express 5, TypeScript strict, zod, `pg` with plain SQL, `jsonwebtoken`, `bcryptjs` |
| Database | Postgres on Supabase, used as plain Postgres (no Supabase Auth, Data API off) |
| Market data | Twelve Data, Basic (free) plan |
| Tests | Vitest, plus supertest for routes |
| Tooling | Node 24, pnpm 10.33.0 (pinned with `packageManager`) |

This is the stack the brief prefers, so there is nothing to justify beyond that.

**Repository layout**

```
backend/     Express API: src/{routes,services,repositories,domain,marketdata,middleware}, sql/, scripts
frontend/    Next.js app: src/{app,components,lib}
prompts/     README.md, system/, specs/, sessions/   (the AI log the brief asks for)
odd/tasks/   one planning and progress document per work unit
DECISIONS.md running log of trade-offs and pending observations
```

**Backend layers.** Routes parse and respond, services decide, repositories talk SQL, and `domain/` holds pure functions with no I/O (round picking, normalisation, stats, the coin), all written test-first.

**Data flow and the rate limit**

- Daily history for about 60 US stocks is downloaded **once** by a seed script and stored in Postgres. Playing, revealing and reading stats touch only the database, so the free API limit can never stop the game.
- The live API is used at runtime for one thing the database cannot know: today's price in the reveal. It goes through a credit budget (7 per minute and 750 per day, under the plan's 8 and 800) and an in-memory cache. If the budget or the provider fails, the reveal is complete without it and shows a quiet note.

**HTTP API**

| Method and path | Auth | Purpose |
| --- | --- | --- |
| `GET /status` | no | Liveness, database check, symbols ready, credits used today |
| `POST /auth/register` | no | Create an account, returns a JWT |
| `POST /auth/login` | no | Returns a JWT |
| `GET /auth/me` | yes | Current user |
| `POST /rounds` | yes | Create a round, or return the open one |
| `POST /rounds/:id/decision` | yes | Record buy or pass, returns the reveal and the streak |
| `GET /rounds/:id/live` | yes | Today's price for a decided round |
| `GET /rounds?limit=20` | yes | Last decided rounds |
| `GET /stats` | yes | Scoreboard, coin range and verdict |

The full contract, error codes and schema are in [`prompts/specs/02-backend.md`](prompts/specs/02-backend.md).

## Run it locally

**Requirements:** Node 24, pnpm 10 (`corepack enable` picks the pinned version), a Postgres database (a free Supabase project works) and a free Twelve Data API key.

**1. Backend**

```bash
cd backend
pnpm install
cp .env.example .env      # then fill it in, see below
pnpm migrate              # creates the five tables, with RLS
pnpm seed                 # downloads ~60 stocks: ~60 credits, ~9 minutes
pnpm seed:check           # read-only summary of what was stored
pnpm seed:demo            # optional: the demo account with 40 played rounds
pnpm dev                  # API on http://localhost:4000
```

`backend/.env`:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase **Session pooler** connection string (port 5432). No `sslmode` or other SSL parameters: the backend refuses to start with them, because TLS is configured in code and verified against the committed CA. |
| `JWT_SECRET` | 32+ random bytes, e.g. `openssl rand -base64 48` |
| `TWELVE_DATA_API_KEY` | Your Twelve Data key |
| `CORS_ORIGIN` | `http://localhost:3000` (a comma-separated list of exact origins) |
| `PORT` | `4000` |
| `TRUST_PROXY_HOPS` | `0` locally |
| `DEMO_EMAIL`, `DEMO_PASSWORD` | Only for `pnpm seed:demo`. Public by design. |

**2. Frontend**

```bash
cd frontend
pnpm install
cp .env.example .env.local   # then fill it in
pnpm dev                     # http://localhost:3000
```

`frontend/.env.local`:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` (no trailing slash) |
| `NEXT_PUBLIC_DEMO_EMAIL`, `NEXT_PUBLIC_DEMO_PASSWORD` | Same as the backend's demo values. Leave empty to hide the demo link. |

**3. Checks**

```bash
# in backend/ and in frontend/
pnpm test && pnpm typecheck && pnpm lint && pnpm build
```

No test touches the network or a real database: the provider is faked and repositories run in memory.

**Deployment.** Render (root directory `backend`, build `corepack enable && pnpm install --frozen-lockfile && pnpm build`, start `node dist/index.js`, `NODE_VERSION=24`, `TRUST_PROXY_HOPS=3`) and Vercel (root directory `frontend`, plus `ENABLE_EXPERIMENTAL_COREPACK=1`). Both redeploy on every push to `main`. Vercel also builds a preview for every other branch; to reach the API, its address has to be added to `CORS_ORIGIN`, and removed after the merge.

## Key decisions and trade-offs

The full log, with dates and alternatives, is in [`DECISIONS.md`](DECISIONS.md). These are the ones I would defend first.

**Product**

- **The future is sealed on the server.** Before a decision, the round response contains only an id, 252 numbers between 0 and 1 and a `resumed` flag. The response is built from an explicit allow-list, and a contract test checks that the body never contains the symbol, the company name or any date. Hiding fields in the UI would not be enough.
- **Shape only.** The chart is min-max normalised over the shown window, so neither the price level nor the amplitude gives the stock away.
- **No rerolls.** One open round per user, enforced by a partial unique index in Postgres. Closing the app does not skip a hard chart, and two taps at once still leave one open round.
- **Results are frozen.** A round stores its forward return when it is created, so later data refreshes can never change a recorded result.
- **Honest numbers.** The sample size sits next to every verdict. A rounded value never shows a sign the real value does not have. Coin ties count on neither side, and the share of coins you beat is rounded down, so it never flatters the user.
- **A guided tour that can be skipped.** Six steps the first time a browser plays, each pointing at one part of the screen, with **Saltar** on every step, and a countdown to the first verdict. Added after the submission: first-time players did not know what was measured or when the verdict would come. A three-line card came first; the author replaced it with the tour.
- **Neutral Spanish for Mexico.** Tú, never voseo; `es-MX` dates and numbers; prices always labelled `USD`, because a bare `$` reads as pesos in Mexico.

**Security**

- **JWT issued by our own backend** (HS256, algorithm pinned, 7-day expiry, no refresh token). The brief asks for JWT between my frontend and my backend, and owning it keeps the whole flow explainable. Supabase Auth was the alternative.
- **Token in `localStorage`.** It is readable by scripts on the page. The safer httpOnly cookie needs frontend and backend on the same site, and they are on two hosts. The app renders no user HTML and loads no third-party scripts, which keeps the exposure small. Next step: proxy the API through the Next.js host and switch to a cookie.
- **Passwords:** bcrypt, 8 characters to 72 *bytes* (bcrypt ignores everything after byte 72).
- **Rate limit per visitor**, not per proxy. Render puts proxies in front of the service, so Express trusts exactly the measured number of hops (`TRUST_PROXY_HOPS=3`), never `true`, which would let a client forge its address.
- **Errors never leak.** API messages never include a symbol or a date. 4xx errors are logged without the request body, so a malformed login never writes a password to the logs.
- **Database:** TLS verified against Supabase's CA, SSL parameters in the URL rejected at boot, Supabase's auto-generated Data API turned off, and row level security on every table.
- **Strict boot:** the server exits with a clear message if a variable is missing or `CORS_ORIGIN` contains anything that is not an exact origin.

**Data**

- **A stored series is a snapshot.** Split-adjusted history is rewritten when a stock splits, so a series is always replaced whole, in one transaction, never appended. Mixing two adjustment bases would draw a fake cliff.
- **Bad provider data is filtered on ingest:** fewer than 400 bars, non-positive closes and weekend bars are rejected. The seed check found a Sunday bar in CVS (2009-07-26) with a +144% spike.
- **The universe** is about 60 US stocks across sectors, deliberately including some that did badly.

**Infrastructure**

- **Render, Vercel and Supabase on free plans,** with the backend and the database in the same region (Virginia / us-east-1). The database was first created in Oregon by mistake and moved before seeding.
- **`/status`, not `/health`.** A default ad-block list blocks cross-site requests to `/health` on Render's domain, which would have left the cold-start screen waiting forever in Brave. Found by testing in the target browser.
- **A cold-start screen** instead of a blank page while Render wakes up.
- **pnpm**, pinned with `packageManager` so Render, Vercel and a local clone use the same version.

## What I left out, and why

| Left out | Why |
| --- | --- |
| Search, watchlists, a ticker page | Anonymity is the product. Knowing the name before deciding destroys the measurement. |
| Candlesticks, indicators, volume | The user is a beginner on a phone; "only the shape" is the whole test. |
| Sell / short, position size, fees | One question keeps a round at ten seconds and the scoreboard explainable. |
| Leaderboards, sharing | The comparison that matters is against a coin, not against other people. |
| Email verification, password reset | Needs an email service. The demo account and open sign-up cover the review. |
| Play before sign-up | Time. It is the first thing I would add. |
| Dividends | Price return only, stated in the UI. It affects picks and the benchmark alike. |
| Refresh tokens | A 7-day token is acceptable for a game with no money in it. |

## Known limitations

**About the measurement**

- **Survivorship bias.** The universe is built from stocks that still trade. Companies that went to zero are missing, so "buy everything" looks better than it was for an investor at the time.
- **Recognisable charts.** A market-wide crash (early 2020) is visible in almost any chart of that period and hints at the date.
- **Three months is arbitrary.** A different horizon would give a different verdict for the same call.
- **Price return, no costs.** No dividends, fees or taxes. This penalises high-dividend stocks such as REITs.
- **Small samples.** Fifty rounds cannot prove skill. The coin range exists to make that visible.

**About the data**

- **Prices are split-adjusted,** so a price shown for 2019 can differ from what the stock traded at that day. The reveal says so.
- **Spin-offs are not adjusted** (MRK, PFE, BIIB, APD, O): the split adjustment does not cover them.
- **A split after the last download** makes the "since then" figure wrong until that series is downloaded again.
- **Twelve Data's free plan** is listed for internal, non-display use. A public product would need a display licence.

**About the system**

- **The live price can spend up to one API credit per reveal.** If the daily budget runs out, the reveal shows a note instead of today's price and the game continues.
- **Per-process limits.** The per-minute credit window and the live-price cache live in memory, so the seed script and the server do not see each other's minute usage.
- **No browser test suite.** UI behaviour was checked by hand and with headless runs, not with committed end-to-end tests.

Pending observations from the reviews, each with a proposed fix and its cost, are listed in [`DECISIONS.md`](DECISIONS.md).

## How I worked with AI

Everything is in [`prompts/`](prompts/), and [`prompts/README.md`](prompts/README.md) explains the tools and the method. In short:

1. **Spec first.** The idea, the user and the scope were written in [`prompts/specs/`](prompts/specs/) before any code. I drafted them with Claude (Fable 5.2) in claude.ai from my own product brief, then reviewed and changed them. I used the same chat to review each prompt before sending it to the agent.
2. **Project rules** in [`CLAUDE.md`](CLAUDE.md) (copied to [`prompts/system/`](prompts/system/)): the invariants, the stack and how the agent must work.
3. **One work unit per session** with Claude Code, following Gentle-AI's ODD workflow. Each unit has a planning and evidence document in [`odd/tasks/`](odd/tasks/), and its prompts, verbatim and in order, in [`prompts/sessions/`](prompts/sessions/).
4. **Tests first** for the domain logic, with each test seen failing before the code.
5. **Reviews.** A separate agent with no context from the build reviewed the two security-sensitive units. It found, among other things, that a malformed JSON body could write a password to the logs, and that the login form could send the password in the URL before the JavaScript loaded. Both were fixed with tests. Gentle-AI's built-in review (RDD) assessed every commit from unit 1; from unit 4 on it was the only review.
6. **The spec is the source of truth.** The rule was that a deviation changes the spec in the same commit, with a line in `DECISIONS.md`. It did not always hold: an audit after the submission found several changes that came in with the visual redesign without an explicit decision ([`DECISIONS.md`](DECISIONS.md), [session 11](prompts/sessions/11-onboarding.md)).

Every session log has a section on what the AI got wrong and what I fixed by hand.

## After the submission

The submitted version is commit [`f1ba936`](https://github.com/atarico/guess-up/tree/f1ba936). Later changes go through pull requests and are logged like the rest, under "After the submission" in [`prompts/README.md`](prompts/README.md).

- **The welcome chart** (`ea32269`): its two dotted futures appear only after the line is drawn.
- **An audit of the screens against the frontend spec** (PR #2). The visual redesign had brought changes nobody decided. Each one was traced to its origin and then decided, and the spec was brought up to the code.
- **Orientation for a first-time player** (PR #2):
  - a three-line card the first time, which `¿Cómo funciona?` brings back;
  - a streak that says what it counts;
  - a countdown to the first verdict, and a notice when it is ready;
  - `Estadísticas` as text instead of an icon, and `puntos` instead of `pp`;
  - the `?` zone back in the sealed chart, so nothing moves sideways at the reveal;
  - room for the chart on very short phones.
- **A guided tour** (branch `tutorial`): six steps that replace the three-line card, each pointing at one part of the play screen.

## Time spent

The brief estimates about 3 hours. My own plan in the product spec already added up to about 4. My estimate of **active work is about 6 to 7 hours**, spread over roughly 15 hours of wall clock. Before that, the idea and the specs took `TODO(author): time on the specs` in claude.ai.

**Why the commit timestamps do not match the effort.** The commits span most of 20 November (UTC−3). They show *when* things happened, not how long I worked:

- **The first two hours or so were at the desk:** reviewing the specs, the preflight check against Twelve Data, the scaffold and the first deploys.
- **The rest was intermittent.** I drove Claude Code remotely from my phone while looking after my son: a few minutes to read a plan or a review and answer, then back to him. The agent kept working between my messages (writing code, running tests, reviews, deploy checks), and it waited whenever it needed a decision from me.
- **So the durations in `odd/tasks/` and `prompts/sessions/` are the agent's elapsed time,** including the time it spent waiting for me, not my working time. Units 1 and 3, for example, each span more than an hour and a half of wall clock.

| Work unit | Planned | Notes |
| --- | --- | --- |
| 1. Scaffold, schema and both deploys | 30 min | The longest, see below |
| 2. Market data client, credit budget, seed | 30 min | Close to plan |
| 3. Auth | 25 min | The plan covered only the backend; the form, the proxy measurement and a security review were extra |
| 4. Rounds API and domain | 40 min | |
| 5. Play screen and reveal | 45 min | |
| 6. Stats | 25 min | |
| 7. Demo account | 15 min | Includes cleaning bad provider data found by the seed check |
| 8. Cold-start screen | 10 min | |
| 9. P1 items, README, final checks | 25 min | |
| 10. Visual redesign | Not in the plan | Done after unit 9; it also rewrote parts of the frontend spec |
| 11. Audit and onboarding | After the submission | Not counted in the hours above; see [After the submission](#after-the-submission) |

Where the time went:

- **First deploys.** Setting up the accounts, moving from npm to pnpm and then fixing the package-manager version on both hosts, an ad-block list blocking requests, and moving the database to the backend's region.
- **Security reviews that were not in the plan.** Two independent reviews found real issues; fixing them with tests took longer than the units themselves.
- **Data quality.** Checking every day-to-day move above 40% in the seeded data, which found the bad CVS bar.

## What I would do with more time

- **Guest play:** let people play before signing up.
- **httpOnly cookie** through a Next.js proxy, instead of `localStorage`.
- **Email verification and password reset.**
- **Revoke the default privileges** Supabase gives to its public roles (a third layer on top of the Data API being off and RLS), with a migration runner that applies numbered files in order.
- **A scheduled refresh** of stale series and a daily health ping so the free database is never paused.
- **Remove survivorship bias** by adding delisted companies, and offer total return with dividends.
- **A confidence slider** with a calibration chart ("when you were 90% sure, you were right 55% of the time").
- **End-to-end tests** for the play and stats screens.
- **Close the pending observations** listed in `DECISIONS.md`.

---

Educational project. Not investment advice. Historical prices from Twelve Data; prices may be delayed.

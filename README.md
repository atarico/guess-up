# Guess-Up

A real, anonymous stock chart, cut at a random past date. Buy or pass. Then the truth: the company, the dates and what happened over the next three months. Over many charts it tells you whether your picks beat buying everything, and whether they beat a coin.

Take-home test for RUUT (Fullstack). The specs that drove the work are in [`prompts/specs/`](prompts/specs/); every trade-off is in [`DECISIONS.md`](DECISIONS.md); the AI sessions are in [`prompts/`](prompts/README.md).

## Try it

| | |
| --- | --- |
| App (Vercel) | https://guess-up-frontend-kappa.vercel.app |
| API (Render) | https://guess-up-api.onrender.com, health check at [`/status`](https://guess-up-api.onrender.com/status) |
| Demo account | `demo@test.com` · password: **TODO(author): demo password** · or the `Probar la cuenta demo` link on the welcome screen |
| Sign-up | Open: any email and a password of at least 8 characters |

The demo account has 40 rounds already decided by a seeded coin, so Stats shows a verdict without playing; a banner says so. The free backend sleeps after 15 minutes without traffic: the first request then waits up to about a minute behind a `Despertando el servidor…` screen.

## What it is, and for whom

**For** the beginner investor who believes they can read charts, on a phone, in short sessions (01 §2). The interface is in neutral Spanish for users in Mexico; prices are always `USD`, never a bare `$`.

**The problem:** the market takes months to say whether a prediction was right, so this user has no honest feedback loop (01 §3).

**The loop:** one year of a real chart with no name, no dates and no price scale → buy or pass → the reveal → a running score against two benchmarks: buying every chart, and a coin that buys as many charts at random, 2,000 times (01 §4, §8).

## Where the financial data is

In the **reveal**, right after the decision (01 §7, 03 §5.3). Before it, the server sends only a round id and 252 normalised numbers (invariant 1, tested).

| Shown | Source |
| --- | --- |
| Ticker, company, sector, exchange | `symbols` (name and sector from `backend/src/data/universe.ts`, exchange from Twelve Data) |
| The real dates: window start, cutoff, end of the three months | `daily_closes` |
| The chart: 252 trading days, then the next 63 drawn in, green or red | Daily closes, split-adjusted |
| Three-month price return, with your call | Frozen when the round was created (invariant 5) |
| Price at the cutoff and three months later, in `USD` | `daily_closes` |

**Stats** turns your decisions into averages: your picks, buying everything, what you passed on, your edge in percentage points, the coin's range and the verdict, hit rate and streaks (03 §5.4). Today's live price in the reveal (P1) is **not built** yet; see [What was left out](#what-was-left-out).

## Run it locally

You need Node 24, pnpm 10 (pinned with `packageManager`), a **Supabase** Postgres project, and a Twelve Data API key (free Basic plan). The backend verifies the database's TLS certificate against Supabase's root certificate (`backend/certs/supabase-ca.crt`, `src/db.ts`), so a plain local Postgres is refused.

```sh
git clone https://github.com/atarico/guss-up.git && cd guss-up

# Backend: http://localhost:4000
cd backend
pnpm install            # pnpm may warn "Ignored build scripts: esbuild"; nothing else is needed
cp .env.example .env    # then fill it in (table below)
pnpm migrate            # applies sql/001_init.sql in one transaction
pnpm seed               # about 60 symbols at 7 per minute: roughly 9 minutes; resumable
pnpm seed:check         # read-only report: status, bars and dates, moves above 40%
pnpm seed:demo          # the demo user and its 40 rounds; prints the verdict Stats will show
pnpm dev

# Frontend: http://localhost:3000, in a second terminal
cd frontend
pnpm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
pnpm dev
```

| Backend variable | What it is |
| --- | --- |
| `DATABASE_URL` | Supabase connection string, without SSL parameters (TLS is set in `src/db.ts`) |
| `JWT_SECRET` | At least 32 characters |
| `TWELVE_DATA_API_KEY` | Used by `seed`; `seed:check` and `seed:demo` do not call the provider |
| `CORS_ORIGIN` | Exact origins, comma-separated, e.g. `http://localhost:3000` |
| `PORT` | `4000` |
| `TRUST_PROXY_HOPS` | `0` locally (3 on Render, measured) |
| `DEMO_EMAIL`, `DEMO_PASSWORD` | For `seed:demo`; must pass the `/auth` rules |

| Frontend variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | The backend's URL |
| `NEXT_PUBLIC_DEMO_EMAIL`, `NEXT_PUBLIC_DEMO_PASSWORD` | Optional. Without both, the demo link is not rendered |

**Checks**, in each package: `pnpm test` (Vitest, no network and no database), `pnpm typecheck`, `pnpm lint`, `pnpm build`. Followed on a clean clone on 2026-11-20 without any secret: install, test, typecheck, lint and build pass in both packages (backend 177 tests, frontend 63). `migrate`, `seed` and `dev` need the variables above. Without them, the backend refuses to start and names what is missing.

## Architecture

```
Browser ── Next.js on Vercel ──HTTPS, JWT──▶ Express 5 on Render ──▶ Postgres on Supabase
                                                      │
                          seed script (and the P1 live price) ──▶ Twelve Data, through one client and one credit budget
```

| Part | Where | Notes |
| --- | --- | --- |
| Frontend | `frontend/src/{app,components,lib}` | App Router, Tailwind, a hand-written SVG chart. Every API call goes through `lib/api.ts`, which also waits for a sleeping server. All copy in `lib/copy.ts` |
| Backend | `backend/src/{routes,services,repositories,domain,marketdata,middleware}` | Express 5, zod, `pg`, `jsonwebtoken`, `bcryptjs`. Round picking, normalisation, stats and the coin are pure functions in `domain/`, written test-first |
| Database | `backend/sql/001_init.sql` | Plain Postgres: `users`, `symbols`, `daily_closes`, `rounds`, `api_usage`. Supabase Auth and its Data API are not used; RLS is on with no policies |
| Contract | `prompts/specs/02-backend.md` §7 | Types mirrored by hand in `frontend/src/lib/api-types.ts` |

**Rules every change keeps** (`CLAUDE.md`, product invariants): no future leak before the decision (a contract test checks every field, header and log line); no rerolls (one open round per user, enforced by a partial unique index); the game never waits on the provider; one door to the provider; stats are frozen at round creation; honest numbers (sample sizes shown, no rounding that flips a sign).

### The API limit

Twelve Data's free plan gives 8 credits a minute and 800 a day (02 §5.1). The design spends them once, not per player (01 §10, 02 §5):

- **History is downloaded once.** `pnpm seed` makes one request per symbol, one credit, for up to 5,000 daily closes, and stores them in Postgres: about 60 credits for the whole universe. A series is a snapshot: refreshed whole, never appended, because split adjustments rewrite history (02 §5.2).
- **Playing costs no credits.** Rounds, reveals and stats are built from the database, so the limit cannot stop the game.
- **One budget** (`marketdata/creditBudget.ts`): at most 7 a minute (a sliding window in memory) and 750 a day (a row in `api_usage`, taken in one atomic statement). The seed waits for a free minute slot and stops at the daily cap; a later run resumes where it stopped.
- **Known limit:** the minute window lives in each process, so seed while the deployed server is idle (02 §5.3).

## Decisions and trade-offs

The full log, with the reason and the cost of each, is [`DECISIONS.md`](DECISIONS.md).

| Decision | Why | Cost |
| --- | --- | --- |
| Rounds built from stored history | The free API limit cannot stop the game | Prices are as of the last seed |
| Anonymity enforced by the server, with a contract test | A UI rule could leak through the network tab | None in the product; it shaped the API |
| Score against "buy everything" and a 2,000-trial seeded coin | A beginner can read "worse than a coin" without statistics | The coin reruns on every `/stats` call |
| Decisions immutable, no rerolls | Skipping a chart would be an unrecorded pass | A stuck open round would block a user (pending) |
| JWT in `localStorage`, 7 days, no refresh token | Frontend and backend are on different sites, so a cookie needs a proxy | Any script on the page can read the token |
| No email verification, no password reset | Out of the time budget | A forgotten password means a new account |
| `/health` renamed `/status` | EasyPrivacy, on by default in Brave and uBlock, blocks `onrender.com/health` | — |
| Large spin-offs left out of the universe | Prices are adjusted for splits only | Small spin-offs remain (known limitation) |
| Weekend bars discarded on ingest | Twelve Data returned a bad Sunday bar for CVS | — |
| Cold start: wait up to 90 s, resend only what the server never got | Render's free tier sleeps | An offline visitor waits up to 90 s before the error |
| Demo account played by a coin with a fixed seed | A reviewer sees the verdict without playing ten rounds | Anyone can keep playing on it; `seed:demo --reset` restores it |
| Supabase as plain Postgres, TLS pinned to its root certificate | One database, no second auth system | A local Postgres cannot be used as is |

## What was left out

| Left out | Why |
| --- | --- |
| Search, watchlists, a ticker page | Anonymity is the product (01 §11) |
| Candlesticks, indicators, volume | "Only the shape" is the test |
| Sell or short, position sizing, fees | One question keeps a round at ten seconds |
| Leaderboards, sharing | The comparison that matters is against a coin |
| Play before sign-up, password reset, email verification | Time |
| Dividends | Price return only, labelled as such |
| P1 not built: today's live price in the reveal, the last-20-rounds list, the daily health ping, `seed --max-age-days` | Time; built in the order of 01 §11 if time remains |

## Known limitations

From 01 §12, stated in the app or here:

- **Survivorship bias.** The universe is stocks that still trade, so "buy everything" looks better than it was.
- **Recognisable charts.** A market-wide crash (early 2020) hints at the date.
- **A chart can be matched.** Someone with the public prices can slide the 252 points over every window of the 60 listed stocks. Doing so only changes their own record.
- **Three months is arbitrary,** and another horizon would give another verdict.
- **Price return, no costs:** no dividends, fees, taxes or slippage.
- **Small samples.** Fifty rounds cannot prove skill; the coin range is there to show it.
- **Spin-offs.** Small ones remain in the universe and can show as false drops (MRK 2021, PFE 2020, BIIB 2017, APD 2016, O 2021).

## What I would do next

The pending entries of [`DECISIONS.md`](DECISIONS.md), most useful first:

1. **Database privileges:** revoke the default privileges of Supabase's `anon` and `authenticated` roles, and give `migrate` a `schema_migrations` table (unit 1).
2. **An open round can get stuck** if a refresh ever left fewer than 252 closes before its cutoff: void it and open a new one, and make the seed refuse such a refresh (unit 4).
3. **Cache the coin** per user and number of decided rounds instead of rerunning 2,000 trials on every `/stats` call (unit 6).
4. **Offline visitors:** fail at once when `navigator.onLine` is false instead of waiting 90 s; share one `/status` poll between calls (unit 8).
5. **The chart colours the future from the closes** and the headline from the frozen return; at exactly zero they differ. One helper for both (unit 5).
6. **Smaller follow-ups:** proxy-hop and token-subject tests, an email length cap, naming and magic numbers (units 3, 5, 6).
7. **Guest play** before sign-up (01 §11), and the P1 items above.

## Time spent

**TODO(author): time spent, and where it went over the 3-hour guide.**

## Repository

```
backend/      Express API, its tests, the schema (sql/) and the seed scripts
frontend/     Next.js app and its tests
prompts/      specs, system rules and one log per AI session (see prompts/README.md)
odd/tasks/    the plan and logbook of each work unit
DECISIONS.md  every trade-off, with what it costs
```

Not investment advice: past prices only, for practice.

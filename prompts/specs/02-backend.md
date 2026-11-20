# 02 — Backend spec

Implements `01-product.md`. Express 5, TypeScript strict, Postgres (Supabase), Twelve Data. Deployed on Render.

## 1. Responsibilities

1. Issue and verify JWTs.
2. Own the market data: fetch from Twelve Data within the free-tier budget, store it, serve it.
3. Run the game: create rounds without leaking the future, record decisions, reveal.
4. Compute the scoreboard.

## 2. Structure

```
backend/src/
├── index.ts               boot: env check, db pool, app.listen
├── app.ts                 createApp(deps): helmet, cors, json, routes, error handler
├── env.ts                 zod-validated environment; fail fast on boot
├── routes/                auth.ts, rounds.ts, stats.ts, health.ts     (HTTP only)
├── services/              authService, roundService, statsService, liveQuoteService (P1)
├── repositories/          users, symbols, closes, rounds, apiUsage    (SQL only)
├── domain/                pure functions, no I/O (test-first):
│   ├── pickRound.ts       choose cutoff, slice window, forward return
│   ├── normalise.ts       min-max to [0,1]
│   ├── stats.ts           picks / all / passed / edge / hit rate / streak
│   ├── series.ts          checks one provider response before it is stored (§5.2)
│   └── coin.ts            seeded benchmark
├── marketdata/
│   ├── provider.ts        MarketDataProvider interface
│   ├── twelveData.ts      the only file that knows the provider's URLs and shapes
│   ├── fakeProvider.ts    used by every test
│   ├── seed.ts            runSeed: the seed's logic, tested with fakes (§5.5)
│   └── creditBudget.ts    per-minute and per-day limiter
├── middleware/            requireAuth.ts, validate.ts, errors.ts
├── data/universe.ts       curated list: { symbol, name, sector }
└── scripts/               migrate.ts, seed.ts, seedDemo.ts
```

Rule of thumb: routes parse and respond, services decide, repositories talk SQL, domain computes. A domain function never imports from another layer.

`createApp(deps)` receives the repositories and the market-data provider: `index.ts` passes the Postgres ones, route tests pass in-memory ones and `fakeProvider` (§9). It exists from work unit 1 so unit 3 does not rewrite it.

Tooling: Node 24 (LTS), pinned in `engines` and `.nvmrc` in both packages; pnpm 10 as the package manager, pinned with the `packageManager` field, one `pnpm-lock.yaml` per package; ESM (`"type": "module"`); `typescript`, `tsx` for `pnpm dev`, and the needed `@types/*`; ESLint with `typescript-eslint`; Vitest and `supertest`. The local environment is loaded with `node --env-file` (no `dotenv`).

## 3. Database

Plain SQL in `backend/sql/001_init.sql`, applied by hand or with `pnpm migrate`. Accessed with `pg` and parameterised queries. No ORM: five small tables are easier to explain than a schema DSL.

```sql
create extension if not exists pgcrypto;

create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,          -- stored lower-cased
  password_hash text not null,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);

create table symbols (
  symbol     text primary key,
  name       text not null,
  sector     text,
  exchange   text,
  status     text not null default 'pending',  -- pending | ready | failed
  bars       integer not null default 0,
  first_date date,
  last_date  date,
  fetched_at timestamptz
);

create table daily_closes (
  symbol text not null references symbols(symbol) on delete cascade,
  d      date not null,
  close  numeric(18,6) not null check (close > 0),
  primary key (symbol, d)
);

create table rounds (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  symbol         text not null references symbols(symbol),
  cutoff_date    date not null,
  forward_return numeric(9,6) not null,        -- frozen at creation
  decision       text check (decision in ('buy','pass')),   -- null = open
  created_at     timestamptz not null default now(),
  decided_at     timestamptz
);

-- No rerolls: at most one open round per user, enforced by the database.
create unique index one_open_round_per_user on rounds(user_id) where decision is null;
create index rounds_user_decided on rounds(user_id, decided_at) where decision is not null;

create table api_usage (
  day     date primary key,                    -- UTC day
  credits integer not null default 0
);

-- Supabase exposure: RLS on with no policies, so the Data API's roles read nothing.
alter table users        enable row level security;
alter table symbols      enable row level security;
alter table daily_closes enable row level security;
alter table rounds       enable row level security;
alter table api_usage    enable row level security;
```

Notes for the agent:

- **Supabase exposure.** We use Supabase as plain Postgres. Tables in `public` can be reachable through Supabase's auto-generated Data API. We do both: `001_init.sql` enables row level security on every table with no policies (the backend's database role bypasses it), and the Data API is turned off in project settings. `users.password_hash` must never be readable with the anon key.
- **Connection string.** Use the pooler connection string in *session* mode from the Supabase dashboard (Render's network is IPv4). The server, `migrate` and the seed open connections only through `createPool` in `src/db.ts`, which verifies TLS against the committed Supabase root CA with `rejectUnauthorized: true`. A `DATABASE_URL` carrying SSL parameters (`ssl…`, `uselibpqcompat`) would override that, so it stops the process with a message that names the parameter, never the URL or its values. Keep the pool small (`max: 5`). General timeouts, so a database that never answers cannot hang a request: `connectionTimeoutMillis` 10 s and `query_timeout` 30 s, generous enough for the seed's transaction of about 5,000 rows per symbol.
- Size: about 60 symbols × up to 5,000 rows is roughly 300k rows, well inside the free database.

## 4. Auth

Our backend issues the token. Supabase Auth is not used: the brief asks for JWT between frontend and backend, and a 40-line implementation is fully explainable.

- The `user` object is `{ id, email, isDemo }` everywhere it is returned.
- `POST /auth/register` `{ email, password }` → `201 { token, user }`. Email lower-cased and validated; password 8 to 72 characters. Duplicate email → `409 EMAIL_TAKEN`.
- `POST /auth/login` `{ email, password }` → `200 { token, user }`. Wrong email or password → `401 INVALID_CREDENTIALS`, same message for both.
- `GET /auth/me` → `200 { user }`.
- Hashing: `bcryptjs`, cost 10 (pure JS, no native build on the host).
- Token: HS256, `sub` = user id, expiry 7 days, secret from `JWT_SECRET` (32+ random bytes). Sent as `Authorization: Bearer <token>`.
- `requireAuth` verifies signature and expiry, sets `req.userId`. Missing or invalid → `401 UNAUTHORIZED`.
- `express-rate-limit` on `/auth/*`: 20 requests per 15 minutes per IP.
- **The limit must count per visitor, not per proxy.** Render puts its edge and its own proxy in front of the service, so the socket address Express sees belongs to a proxy. Left alone, every visitor shares one `/auth` bucket and twenty logins from anyone lock everyone out.
  - Read an integer `TRUST_PROXY_HOPS` from the environment, default `0`. When it is greater than 0, call `app.set('trust proxy', TRUST_PROXY_HOPS)` right after creating the app. When it is 0 (local development, no proxy), do not call it, so `express-rate-limit`'s own check still warns if a forwarded header ever shows up.
  - Never set it to `true`. That makes the address depend on a header the client can send, and Render appends to that header instead of replacing it.
  - **The number is measured, not assumed.** Render does not document it. In work unit 3 (`01-product.md` §15), together with the `/auth` rate limit, temporarily expose `GET /ip` returning `req.ip` and the raw `X-Forwarded-For` header, start at 1 and raise `TRUST_PROXY_HOPS` until `req.ip` equals your own public IP. One request captured on Render in 2025 carried three addresses in that header (client, edge, internal), so expect 3, but the measured value wins. Too low and visitors still share a bucket; too high and a client can forge its address.
  - Remove `/ip` afterwards. Record the number and the date in `DECISIONS.md`.
  - Check: requests from two different networks show different `req.ip`, and the logs contain neither `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` nor `ERR_ERL_PERMISSIVE_TRUST_PROXY`.

Trade-offs to record in `DECISIONS.md`: no refresh token (a 7-day access token is acceptable for a game with no money in it); no email verification or reset; the frontend keeps the token in `localStorage` (see `03-frontend.md` §7).

## 5. Market data

### 5.1 Provider facts to verify at setup

Limits change. Confirm on the provider's pricing page and against one real response before relying on these, and write what you found in `DECISIONS.md`.

Checked on 2026-11-20 against the docs and real calls (`DECISIONS.md`):

- Basic plan: 8 credits per minute, 800 per day (`/api_usage` reports `plan_limit: 8`, `plan_daily_limit: 800`). The minute quota resets at the start of each clock minute, the daily one at 00:00 UTC. `time_series` and `quote` cost 1 credit per symbol. Responses carry `api-credits-used` and `api-credits-left` for the current minute; a `401` carries neither.
- `GET https://api.twelvedata.com/time_series?symbol=AAPL&interval=1day&outputsize=5000&order=asc&adjust=splits`, header `Authorization: apikey <key>`. Response: `{ meta: { symbol, interval, currency, exchange_timezone, exchange, mic_code, type }, values: [{ datetime, open, high, low, close, volume }], status: "ok" }`, numbers as strings with up to 8 decimals.
- `outputsize` maximum is 5,000 (about 20 years of daily bars). One request per symbol is enough. With `order=asc` the response holds the **most recent** 5,000 bars, oldest first, with no duplicate dates (NVDA: 2007-01-08 → 2026-11-19).
- `adjust` defaults to `splits`. We pass it explicitly. Checked: NVDA closes before its 10-for-1 split of 2024-06-10 come back divided by 10 compared with `adjust=none`.
- (P1) `GET /quote?symbol=AAPL` for the live price: use `close` (a string) and `datetime` (`YYYY-MM-DD`, date only). Confirmed against a real response.
- Error bodies are `{ "code": …, "message": "…", "status": "error" }`, and the HTTP status equals `code`: unknown symbol `404` (still costs 1 credit), invalid key `401` (no credit), minute limit `429`. The docs do not rule out an error inside a `200`, so the client still checks the body's `code` as well as the HTTP status.

### 5.2 A stored series is a snapshot

Split-adjusted history is rewritten by the provider whenever a stock splits. Therefore:

- A symbol's series is always written from **one** response, in **one** transaction: delete that symbol's rows, insert the new ones, update `symbols`. Never append new bars to old ones; mixing two adjustment bases produces a fake cliff in the chart.
- Drop the most recent bar on ingest (it may be a partial trading day).
- Reject the response and mark the symbol `failed` if it has fewer than 400 bars or any non-positive close. Precisely (`domain/series.ts`): every close of the response must be positive, the latest one included; the count is taken after the latest bar is dropped, so at least 400 bars are stored.
- A round's `forward_return` is a ratio of two closes from the same snapshot, so a later re-adjustment cannot change a recorded result (invariant 5).

### 5.3 Credit budget

`creditBudget.ts`, one instance per process.

- Per minute: sliding 60-second window held in memory, cap **7** (one below the limit as a margin).
- Per day: `api_usage` row for the current UTC day, cap **750**, incremented in the same call, in one statement (`insert … on conflict (day) do update … where credits < cap`) so two processes cannot both take the last credit. The minute slot is reserved before the daily counter is asked and handed back if the day refuses. It lives in the database because the host restarts the process often.
- `tryAcquire(): Promise<boolean>` for user-facing calls: returns `false` at once when over budget. Never waits.
- `acquire(): Promise<void>` for the seed script: waits for the next free minute slot. When the daily cap is reached it throws `DailyBudgetExhaustedError` instead of waiting for the next UTC day; the seed stops there and resumes on a later run.
- Takes a clock as a parameter so tests can fake time.

Known limit, documented rather than solved: the minute window is per process. The seed script run from a laptop and the deployed server do not see each other's minute usage, so seed while the server is idle.

### 5.4 Client behaviour

`twelveData.ts` implements `MarketDataProvider { fetchDailyCloses(symbol), fetchQuote(symbol) }`. `fetchQuote` is (P1).

- 5-second timeout on every request.
- Maps failures to typed errors: `UpstreamLimitError` (429 or code 429), `UpstreamAuthError` (401/403, logged loudly), `UpstreamNotFoundError` (unknown symbol), `UpstreamUnavailableError` (network, timeout, 5xx).
- No automatic retries on user-facing calls. The seed script retries a limited symbol once, after the minute window clears.
- The API key is never logged and never sent to the client.

### 5.5 Seeding

- `pnpm seed` reads `data/universe.ts`, upserts each symbol as `pending`, then for every symbol that is not `ready`: `acquire()` → fetch → store → mark `ready` or `failed`. Idempotent and resumable. About 60 symbols takes roughly nine minutes at 7 per minute.
- `symbols.name` and `symbols.sector` come from `universe.ts`; `symbols.exchange` comes from `meta.exchange` in the `time_series` response.
- `pnpm seed --only <SYMBOL>` fetches just that symbol (it must be in the universe): one credit, for an end-to-end check of the real client. The whole universe is still upserted.
- Outcome per symbol: a limit error is retried once after the clock minute turns; an unknown symbol, an unavailable provider or a series rejected by §5.2 marks it `failed` (the next run tries it again); a rejected API key or the daily credit cap stops the whole run, which a later run resumes. The logic lives in `marketdata/seed.ts` (`runSeed`), tested with the fake provider and an in-memory store; `scripts/seed.ts` wires the real database, budget and client.
- (P1) `--max-age-days <n>` also re-downloads `ready` symbols whose `fetched_at` is older than `n` days, replacing each series whole as §5.2 requires. Without the flag, a `ready` symbol is never fetched again.
- Logs one line per symbol: bars stored, date range, credits used today.
- `pnpm seed:demo` (P0) creates the demo user and 40 decided rounds whose decisions come from a seeded coin. It uses the same `roundService` as real play, so demo rounds obey the same rules.
  - Needs at least one `ready` symbol; exits with a clear message otherwise.
  - Idempotent: creates the user if missing (`is_demo = true`) and tops the history up to 40 decided rounds. `--reset` deletes the demo user's rounds first.
  - Credentials come from `DEMO_EMAIL` and `DEMO_PASSWORD`. They are **public by design**: printed in the README and shipped to the browser. They are not secrets and are not redacted in session logs.
  - The demo account is an ordinary account afterwards. Anyone can keep playing on it, and its stats will drift from the coin's.

### 5.6 Live quote (P1)

`liveQuoteService.get(symbol)`:

1. In-memory cache, 15-minute TTL per symbol → return it.
2. `tryAcquire()` false → return `{ available: false, reason: "limit" }`.
3. Fetch with a 2.5-second timeout. On any typed error → `{ available: false, reason: "limit" | "unavailable" }`.
4. On success cache and return `{ available: true, price, asOf }`.

It never throws to the route.

## 6. Game logic (domain, test-first)

```ts
const L = 252, H = 63;

// closes ascending by date. Returns null when the series is too short.
pickRound(series: { d: string; close: number }[], rng: () => number):
  { cutoffIndex: number; shown: number[]; forwardReturn: number } | null
//   valid cutoffIndex t:  L-1 <= t <= series.length-1-H
//   shown  = closes[t-L+1 .. t]          (252 values)
//   forwardReturn = close[t+H] / close[t] - 1

normalise(values: number[]): number[]      // (v-min)/(max-min); all 0.5 when flat

isCorrect(decision: 'buy'|'pass', r: number): boolean   // buy && r>0, or pass && r<=0

computeStats(rounds: { decision: 'buy'|'pass'; r: number }[]): Stats   // chronological

coinBenchmark(returns: number[], buys: number, seed: number, trials = 2000):
  { p5: number; p95: number; edges: number[] }
//   each trial: choose `buys` rounds at random without replacement,
//   edge = mean(chosen) - mean(all)
```

- `rng` is injected everywhere; production uses `Math.random` for picking rounds and a small seeded generator (mulberry32) for the coin.
- Coin seed: a hash of `userId` and the number of decided rounds, so the range is stable across reloads and changes only when a new round is decided.
- `percentile` = share of coin edges that are less than or equal to the user's edge.
- Verdict: `insufficient` (fewer than 10 rounds) → `bought_none` / `bought_all` → `worse` (edge < p5) / `better` (edge > p95) / `coin`.

## 7. HTTP API

JSON in, JSON out. All routes except `/status` and `/auth/register|login` require the bearer token. Returns are decimals (`0.021` = +2.1%). Dates are `YYYY-MM-DD`.

Errors always look like `{ "error": { "code": "…", "message": "…" } }`. Codes: `VALIDATION` 400, `UNAUTHORIZED` 401, `INVALID_CREDENTIALS` 401, `NOT_FOUND` 404, `EMAIL_TAKEN` 409, `ROUND_OPEN` 409 (P1, used only by the live endpoint), `PAYLOAD_TOO_LARGE` 413, `UNSUPPORTED_MEDIA_TYPE` 415, `NO_DATA` 503, `INTERNAL` 500. Malformed JSON is `400 VALIDATION`; `413` and `415` come from the JSON body parser (a body over its 100 kB limit, an unsupported `Content-Encoding`). Error messages never include a symbol or a date. The `message` is English and written for developers; the interface is Spanish and maps `error.code` to its own text, so `message` is never shown to a user.

### `GET /status`
The health check. Not `/health`: EasyPrivacy, a filter list that Brave Shields and uBlock Origin apply by default, blocks cross-site requests to `onrender.com/health` (`DECISIONS.md`). The path is one constant on each side, `HEALTH_PATH` in `routes/health.ts` and in `frontend/src/lib/api.ts`.

`200 { ok: true, db: true, symbolsReady: 58, credits: { usedToday: 61, dailyCap: 750 } }`. Runs `select 1`; used by the cold-start screen and by the daily keep-alive ping (P1). It answers `200` whenever the process is up: if `select 1` fails, or the database checks take longer than 2 s (`HEALTH_DB_TIMEOUT_MS`; Render's health check needs an answer within 5 s), the body is `{ ok: true, db: false }` with no other fields, so Render keeps the deploy live and the cold-start screen stops waiting (`03-frontend.md` §8).

### `POST /rounds` — create or resume
Returns the user's open round if there is one, otherwise creates one.

```json
{ "round": { "id": "7b0c…", "points": [0.41, 0.43, "… 252 numbers …"] }, "resumed": false }
```

- Service: look for an open round → else pick a random `ready` symbol, load its closes, `pickRound`, insert. If the insert hits the unique index (two taps at once), read and return the existing open round.
- On resume, `points` is rebuilt from stored closes using `symbol` and `cutoff_date`.
- No `ready` symbols → `503 NO_DATA`.
- **The response object is built from an explicit allow-list of fields.** Never spread a database row into it.

### `POST /rounds/:id/decision`
Body `{ "decision": "buy" | "pass" }`.

```json
{
  "reveal": {
    "symbol": "NVDA", "name": "NVIDIA Corporation", "sector": "Technology", "exchange": "NASDAQ",
    "startDate": "2018-03-12", "cutoffDate": "2019-03-12", "endDate": "2019-06-11",
    "history": [{ "d": "2018-03-12", "c": 61.2 }, "… 252 …"],
    "future":  [{ "d": "2019-03-13", "c": 41.9 }, "… 63 …"],
    "forwardReturn": -0.124,
    "decision": "buy",
    "correct": false
  },
  "streak": { "current": 0, "best": 6 }
}
```

- Updates with `where id = $1 and user_id = $2 and decision is null`. If no row was updated and the round exists and is decided, return the reveal with the **stored** decision (idempotent; the first answer stands). Unknown id or another user's round → `404`.
- Touches Postgres only.

### `GET /rounds/:id/live` (P1)
Only for the caller's own, already decided round; an open round → `409 ROUND_OPEN`.

```json
{ "live": { "available": true, "price": 184.2, "asOf": "2026-11-19", "sinceCutoff": 3.1 } }
{ "live": { "available": false, "reason": "limit" } }
```

Always `200`. `sinceCutoff = price / close[cutoff] − 1`.

### `GET /rounds?limit=20` (P1)
Decided rounds, newest first: `[{ id, symbol, name, cutoffDate, decision, forwardReturn, correct, decidedAt }]`.

### `GET /stats`

```json
{
  "rounds": 42, "buys": 19, "passes": 23,
  "avgPicks": 0.021, "avgAll": 0.034, "avgPassed": 0.045,
  "edge": -0.013,
  "coin": { "p5": -0.021, "p95": 0.020, "percentile": 0.17, "trials": 2000 },
  "verdict": "coin",
  "roundsUntilVerdict": 0,
  "hitRate": 0.52,
  "streak": { "current": 2, "best": 6 }
}
```

`avgPicks`, `avgPassed`, `edge` and `coin` are `null` when undefined (no buys, no passes, or too few rounds).

## 8. Cross-cutting

- **Validation:** zod schema per route; failure → `400 VALIDATION` with the first issue.
- **Errors:** one error-handling middleware. Client errors (4xx) keep their status, answer with our own message and log only the status and the error type: never the body, the error object or the parser's message, which can quote what the client sent (part of a password, for instance). Unknown errors log the stack and return `500 INTERNAL` with a generic message.
- **CORS:** only the origins in `CORS_ORIGIN`, a comma-separated list. It starts as `http://localhost:3000`; the Vercel production URL is added after the first deploy (`03-frontend.md` §12). Each entry, trimmed, must be an exact origin (`new URL(o).origin === o`: scheme, host and optional port; no path, no trailing slash, no `*`), because the comparison is strict equality and anything else would silently match nothing. An invalid entry, an empty entry or an empty list stops the boot with a message naming the entry. No credentials; we use a header token.
- **Headers:** `helmet` defaults.
- **Logging:** one line per request (method, path, status, ms), written by `middleware/requestLog.ts` as `GET /status 200 12ms` when the response finishes. The path is logged without its query string; headers and bodies are never logged. Never log tokens, passwords, the API key, or the symbol of an open round.
- **Config:** `DEMO_EMAIL` and `DEMO_PASSWORD` are read only by `seed:demo`, not by the server. `env.ts` validates `DATABASE_URL`, `JWT_SECRET`, `TWELVE_DATA_API_KEY`, `CORS_ORIGIN`, `PORT` at boot and exits with a clear message when one is missing. `TRUST_PROXY_HOPS` is optional, a non-negative integer, default `0` (§4); `backend/.env.example` lists it as `TRUST_PROXY_HOPS=0` and `CORS_ORIGIN` as `http://localhost:3000`. Locally the variables live in `backend/.env` (git-ignored), loaded with `node --env-file`. The server must still boot and serve the game if the provider key is invalid; only seeding and live quotes need it.

## 9. Tests

Vitest. Route tests use supertest with in-memory repositories and `fakeProvider`, passed to `createApp(deps)` (§2). No test touches the network or a real database.

| Area | Must cover |
| --- | --- |
| `pickRound` | index bounds at both ends; returns `null` for short series; forward-return arithmetic; never reads past `t + H` |
| `normalise` | range is [0, 1]; flat series; length preserved |
| `computeStats` | the worked example from `01-product.md` §8; no buys; all buys; streak current and best |
| `coinBenchmark` | same seed gives the same result; `p5 ≤ 0 ≤ p95` on a mixed sample; `buys = n` gives zero spread |
| `creditBudget` | `tryAcquire` is false after 7 in a window and true again after 60 s of fake time; daily cap |
| **No-leak contract** | `POST /rounds` body has exactly `round.id`, `round.points`, `resumed`; 252 values in [0, 1]; the serialised body contains neither the symbol, the company name nor any `YYYY-MM-DD` string |
| Rounds flow | second `POST /rounds` returns the same id; second decision does not change the first; another user's round is 404 |
| Auth | register → login → protected route; 401 without or with a bad token; duplicate email 409 |
| Live quote (P1) | over budget returns `available: false` and does not call the provider |

## 10. Deployment

- **Render** free web service, root directory `backend`, build `corepack enable && pnpm install --frozen-lockfile && pnpm build`, start `node dist/index.js`, health check path `/status`. Render's docs do not mention pnpm, so corepack installs the version pinned in `packageManager`.
- The free instance sleeps after 15 minutes without traffic and takes up to about a minute to wake. The frontend handles this (`03-frontend.md` §8). In-memory state (minute window, quote cache) is lost on sleep, which is safe by design.
- **Supabase** pauses free projects after a week of low activity. A scheduled GitHub Action calls `/status` once a day so the database is awake when the reviewers open the app (P1).
- Run the migration and `pnpm seed` once against the production database from a laptop; then `pnpm seed:demo`.

## 11. Explicitly not built

Refresh tokens, password reset, email verification, admin endpoints, symbol search, websockets, background job queue, multi-instance rate limiting, OHLC and volume storage, dividends. Each has a line in the README under "what I would do with more time" or "left out".

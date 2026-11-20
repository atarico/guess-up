# 01 — Product spec: Guess-Up

Status: accepted for build · Read with `02-backend.md` and `03-frontend.md`

## 1. One line

A real, anonymous stock chart, cut at a random past date. Buy or pass. Then the truth. Ten seconds per attempt to find out whether you can actually read a chart.

## 2. Who it is for

The beginner investor who believes they can read charts. They watch videos about chart patterns and feel they can tell when a stock is "about to move". They have made a few trades. Some went well, and those are the ones they remember.

They are not a professional and do not want a terminal. They use their phone, in short sessions, the way they would play a word game.

The first users are in Mexico, so the interface is written in neutral Spanish (§14, decision 1). Quoted interface text in this spec is the real Spanish copy.

## 3. The problem

This user has no honest feedback loop. The real market takes months to say whether a prediction was right, and by then they have forgotten what they predicted or rewritten the story. Their confidence grows faster than their skill.

Stock apps answer this by showing more data. None of them shows the user's own record of decisions made without knowing the future.

## 4. The idea

Take real price history and remove knowledge of the future.

1. Show one year of a real stock's chart with no name, no dates and no price scale. Only the shape.
2. Ask one question: buy or pass?
3. Reveal the company, the dates, and what happened over the next three months.
4. Keep score against the simplest possible strategy: buying every chart.

The moment the product exists for is one sentence on the stats screen:

> Tus selecciones rindieron +2.1% en promedio. Comprar todas las gráficas rindió +3.4%. Tu criterio te costó 1.3 puntos porcentuales por compra.

In English: your picks averaged +2.1%; buying every chart averaged +3.4%; your judgment cost you 1.3 percentage points per purchase.

### How this answers the brief

The brief asks for "an app to see stock financial data". Guess-Up shows financial data at the moment it carries the most meaning: right after the user has committed to a prediction. The reveal is the data view: ticker, company, sector, real dates, fifteen months of real prices, the three-month return, and today's live price. There is no search box and no watchlist because anonymity is the product. The README states this explicitly, since a reviewer will expect to see financial data and should know where to look.

## 5. Principles

- **The future is sealed.** Nothing about the stock or the date reaches the device before the decision. This is a server rule, not a UI rule.
- **Ten seconds.** One chart, one question, two buttons. No tutorial, no settings.
- **No nudging.** Buy and Pass have equal visual weight. Colour appears only after the decision.
- **Honest over flattering.** Always compare against a benchmark, always show the sample size, say "too early to tell" when it is.
- **Phone first.** Designed at 390 px, thumbs at the bottom. Desktop works and is not the target.

## 6. The round

Definitions: `L = 252` trading days shown (about one year). `H = 63` trading days of future (about three months). Prices are daily closes, split-adjusted.

- **Picking.** Choose a stock uniformly at random from the cached universe, then a cutoff day uniformly at random among days that have `L` closes up to and including it and `H` closes after it. Choosing the stock first keeps long-history stocks from dominating.
- **What the user gets.** The round id, 252 numbers between 0 and 1 (the closes, min-max normalised over the shown window) and the `resumed` flag. Nothing that identifies the stock or the date.
- **The decision.** `buy` or `pass`. Recorded once. It cannot be changed.
- **No rerolls.** A user has at most one open round. Asking for a new one while a round is open returns the open one, so closing the app is not a way to skip a chart. Skipping would be an unrecorded pass and would corrupt the record.
- **Forward return.** `close[cutoff + H] / close[cutoff] − 1`. Computed and stored when the round is created.
- **Right or wrong** (game layer only): a buy is right when the forward return is above zero; a pass is right when it is zero or below.

## 7. The reveal

Shown immediately after the decision, from our own database:

- Ticker, company name, sector, exchange.
- The real dates: start of the window, cutoff, end of the three months.
- The chart continues: the next 63 days draw in, green if the stock ended higher than the cutoff, red if lower.
- The headline number: the three-month return (`▼ −12.4%`), with the user's call next to it ("Compraste. Bajó.").
- Price at the cutoff and price three months later (`USD 61.20 → USD 53.61`).
- Streak update.

Loaded a moment later from the live API, and allowed to fail quietly:

- **Today's price** and the change since the cutoff ("Hoy: USD 184.20 · ▲ +310% desde entonces").

Prices are US dollars and are always labelled `USD`. In Mexico a bare `$` reads as pesos, so it is never used. Nothing is converted to pesos.

Then one button: next chart.

## 8. The scoreboard

Let `A` be all decided rounds, `B` the rounds where the user bought, `P` the rounds they passed, `r` the forward return of a round.

| Figure | Definition | Meaning |
| --- | --- | --- |
| Picks | mean of `r` over `B` | What the charts you chose did |
| Buy everything | mean of `r` over `A` | What every chart you were shown did |
| Passed | mean of `r` over `P` | What you left on the table |
| **Edge** | Picks − Buy everything, in percentage points | What your judgment added or cost per pick |
| Hit rate | share of rounds called right (§6) | Game layer |
| Streak | consecutive right calls, current and best | Game layer |

**Why "picks versus all" and not "pass counts as 0%".** If a pass counted as a 0% return, a user in a rising market would be punished for passing at all, and the number would mostly measure how often they buy. Comparing the average of what they bought with the average of everything they saw isolates the one thing the product claims to measure: whether they can tell good charts from bad ones.

**The coin.** The coin buys the same number of charts as the user, chosen at random from the same rounds. We run that 2,000 times with a fixed seed and record the coin's edge each time. From this we show:

- the range the coin lands in 90% of the time (5th to 95th percentile), and
- the share of coins the user beat.

Verdict: inside the coin's range reads "Por ahora, tu criterio no se distingue de lanzar una moneda"; above it, "Por ahora, mejor que una moneda"; below it, "Por ahora, peor que una moneda". "Por ahora" (so far) stays in every variant. With few rounds the range is wide, and that width is part of the lesson.

**When there is no verdict yet.**

- Fewer than 10 decided rounds: show progress ("Faltan 6 gráficas para tu primer veredicto.").
- No buys yet, or bought every chart: there is no selection to measure; say so plainly ("Compraste todas las gráficas, así que tu resultado es el mismo que el de comprar todo.").

The full, approved wording of every verdict and coin sentence is in `03-frontend.md` §5.4.

**Worked example** (also the first unit test): rounds `+10% buy`, `−5% buy`, `+8% pass`, `+2% pass`. Picks = +2.5%. Buy everything = +3.75%. Passed = +5.0%. Edge = −1.25 points. Hit rate = 1 of 4.

## 9. Screens

1. **Welcome.** One sentence, sign up, log in, and "try the demo account".
2. **Play.** The chart, the question, two buttons. After the decision the same screen becomes the reveal.
3. **Stats.** The verdict sentence, the three averages, the coin range with the user's marker, hit rate and streaks, and the last 20 rounds.

Details, states and copy are in `03-frontend.md`.

## 10. Data and the rate limit, from the product side

- Daily history for a stock is downloaded once and stored in Postgres. Rounds are built from the database, so playing costs no API credits and the free-tier limit cannot stop the game.
- The live API is used at runtime for one thing the database cannot know: today's price in the reveal. If the limit is reached, the reveal is complete without it and shows a quiet note.
- The universe is a curated list of about 60 US stocks across sectors, deliberately including ones that did badly. It lives in the repo as data and needs sign-off from the author before seeding.
- A stored series is treated as a snapshot and replaced whole when refreshed (see `02-backend.md` §5), because adjusted history is rewritten after a split.

## 11. Scope

**P0: the product does not exist without these**

- Sign up, log in, JWT on every API call.
- Play a round under the rules in §6. One open round per user.
- Reveal from stored data (§7, first list).
- Stats: picks, buy everything, edge, the verdict sentence, the coin range, hit rate, streak.
- Stored price history, credit budget, graceful behaviour when the provider is unavailable.
- Demo account with pre-played history, so a reviewer sees the verdict without playing ten rounds. Its decisions are made by a seeded coin and the account is labelled as such. It is the last P0 unit (§15) because it needs rounds and stats to exist. The interface hides the demo link when no demo credentials are configured, so there is never a dead button.
- Cold-start screen ("waking the server"). The free backend sleeps after 15 minutes without traffic and the first request after that can take about a minute. Without this screen, the first thing a reviewer sees is an app that looks broken.
- Both services deployed; README; `/prompts`.

**P1: build in this order if time remains**

1. Live "today" price in the reveal.
2. Last-20-rounds list on the stats screen.
3. Daily health ping so the free database is not paused before the review.
4. Re-downloading old series with the seed script's `--max-age-days` flag.

**Out, and why**

| Left out | Why |
| --- | --- |
| Search, watchlists, a ticker page | Anonymity is the product. Knowing the name before deciding destroys the measurement. |
| Candlesticks, indicators, volume | Target user is a beginner on a phone; "only the shape" is the whole test. Also quadruples stored data. |
| Sell / short, position sizing, fees | One question keeps a round at ten seconds and keeps the stat explainable. |
| Leaderboards, sharing | The comparison that matters is against a coin, not against other people. |
| Play-before-signup, password reset, email verification | Time. Guest play is the first thing to add with more time. |
| Dividends in returns | Price return only, stated in the UI. Affects picks and benchmark alike. |

## 12. Known limitations, stated in the README

- **Survivorship bias.** The universe is built from stocks that still trade. Companies that went to zero are missing, so "buy everything" looks better than it was for an investor at the time.
- **Recognisable charts.** A sharp, market-wide drop (early 2020) is visible in almost any chart from that period and hints at the date. Not solved.
- **Three months is arbitrary.** A different horizon would give a different verdict for the same call.
- **Price return, no costs.** No dividends, fees, taxes or slippage.
- **Small samples.** Fifty rounds cannot prove skill. The coin range exists to make that visible.
- **Split after the last refresh.** The "since then" figure can be wrong until that series is refreshed.
- **Spin-offs.** Prices are adjusted for splits only, so a spin-off can show up as a sudden drop and a false return. Stocks with large spin-offs in their history were left out of the universe; small ones are not filtered (MRK 2021, PFE 2020, BIIB 2017, APD 2016, O 2021).

## 13. Acceptance criteria

1. Before a decision, the network response for a round contains only the round id, 252 numbers in [0, 1] and the `resumed` flag. Verified by an automated test.
2. Requesting a new round with one open returns the same round. Two simultaneous requests still leave one open round.
3. A second decision on the same round does not change the first.
4. The stats for the worked example in §8 match exactly.
5. The coin range is identical across reloads until a new round is decided.
6. With the provider key invalid or its limit exhausted, a user can still play, see the reveal and see stats; only the live price is absent.
7. On a 390 px wide screen, a round can be played with one thumb; both buttons are at least 56 px tall and visually equal.
8. A new user reaches their first chart in under 30 seconds from the welcome screen, measured with the backend awake (a cold start can add about a minute, §11).
9. Frontend and backend are reachable at public URLs; the demo credentials in the README work, and the demo account shows a verdict on Stats without playing a round.
10. Every user-facing string, including error states and accessibility labels, is in neutral Spanish with no voseo. Dates and numbers use `es-MX`. No price appears with a bare `$`.

## 14. Open decisions (defaults chosen; change here first)

| # | Decision | Default | Alternative |
| --- | --- | --- | --- |
| 1 | Interface language | Neutral Spanish for users in Mexico: tú form, no voseo, `es-MX` dates and numbers, prices labelled `USD`. All strings in one file. Specs, code and README stay in English. | English; a change to the copy file and the locale in `format.ts` |
| 2 | Who issues the JWT | Our Express backend (email + password) | Supabase Auth, backend verifies |
| 3 | Chart normalisation | Min-max per window: shape only, amplitude hidden | Index to 100, keeps volatility visible |
| 4 | Returns | Price return, split-adjusted | Total return (`adjust=all`) |
| 5 | Coin | Same number of buys as the user | A plain 50/50 coin |

## 15. Build order and cut lines

| # | Work unit | Budget | Session log |
| --- | --- | --- | --- |
| 1 | Scaffold both packages, schema, `/health`, **deploy both skeletons** | 30 min | `01-setup.md` |
| 2 | Twelve Data client, credit budget, seed script, universe | 30 min | `02-market-data.md` |
| 3 | Auth: register, login, JWT middleware | 25 min | `03-auth.md` |
| 4 | Domain (test-first) and rounds API, no-leak test | 40 min | `04-rounds.md` |
| 5 | Play screen and reveal | 45 min | `05-play.md` |
| 6 | Stats API and screen | 25 min | `06-stats.md` |
| 7 | Demo account: seed script, `isDemo` flag, label on Stats, demo link | 15 min | `07-demo.md` |
| 8 | Cold-start handling: wake retry in `api.ts`, `ServerWaking` screen | 10 min | `08-cold-start.md` |
| — | **Cut line: everything above is P0** (3 h 40 min) | | |
| 9 | P1 items in order, then README, prompts log, final deploy check | 25 min+ | `09-polish.md` |

The spec review and provider checks before unit 1 are logged as `00-spec-review.md`.

That adds up to about 4 h 05 min against a 3-hour guide. The README says where the time went. If time has to be recovered, P1 items go first, starting from the bottom of the list.

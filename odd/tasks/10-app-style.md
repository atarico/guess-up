# 10-app-style — The design of the "Guess-Up · app móvil" canvas

Objective: implement the author's design canvas (5 artboards: Bienvenida, Jugar, Revelación, Estadísticas, Despertando el servidor) in the app, with its copy and the new data it shows. Branch: `app-style`, from `main` at `2187d3b`; one commit per task; the author pushes and merges. Tests: Vitest in each package; domain test-first.

## Specs

Quoted verbatim from the author (L1, L2).

- **S1 Request.** "crea una rama app style y vamos con con esto" / pasted: "Implement this design in this codebase:" … "Match how it looks, using this codebase's own components and conventions."
- **S2 Scope: "Diseño completo"** (the author's answer, L2): the look (dark theme, type, cards, the chart with its gradient, each screen's layout), the design's copy and Comprar on the left, and the new data: the coin histogram (a new field in `GET /stats`), the last 20 charts (P1, `GET /rounds?limit=20`, with tests) and the waking screen's counter.

## Contracts shared by the units

- **C1 `GET /stats`:** `coin` gains `histogram: { start: number, width: number, counts: number[] }`: 40 equal bins from the smallest to the largest of the 2,000 coin edges, every edge counted once (the largest in the last bin). If every edge is equal, `width` is 0 and the single bin holds all trials. Computed by a pure domain function, test-first.
- **C2 `GET /rounds?limit=20`** (02 §7, P1): `200 { rounds: [{ id, symbol, name, cutoffDate, decision, forwardReturn, correct, decidedAt }] }`, the caller's decided rounds only, newest first (`decided_at` desc), `limit` 1–20, default 20; anything else `400 VALIDATION`; no token `401`. An open round never appears (invariant 1).
- **C3 Copy:** every new string lives in `frontend/src/lib/copy.ts`, written once in T1; units do not edit it and report any missing string.

## Assumptions (where the design is silent or meets a rule)

- **A1 Kept from the specs, restyled:** `Gráfica N` in the top bar (a pill beside `Racha`); the not-investment-advice footer on the welcome screen (`CLAUDE.md`); `Precios ajustados por splits.` under the prices; `Cerrar sesión` on Stats; the survivorship sentence in the small print (01 §12); the desktop key hints, now `← Comprar · → Pasar` to follow the buttons; `Compraste. No cambió.` for an exact zero (the author's rule), extended to `Pasaste. No cambió.`.
- **A2 Screens the canvas does not draw** take its language: the log-in form, loading skeletons, error and `NO_DATA` states, the stats of fewer than 10 rounds, and the coin sentence when the user is above or below the coin's range.
- **A3 Motion** follows the codebase: CSS transitions and keyframes, all off under `prefers-reduced-motion`; no `requestAnimationFrame` loops.
- **A4 Fonts:** Inter and Space Grotesk through `next/font/google`, no new dependency; numbers use tabular figures instead of a monospace face.

## Tasks

| ID | Task | Specs | Route | Status | Commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T1 | Foundation: tokens, fonts, logo, buttons, all copy, API types; 03 §4 | S1, S2, C3 | inline | done | `feat(frontend): lay the foundation of the app style`; the design's tokens in `globals.css`, Inter and Space Grotesk, `Logo`, `.button`, `.card`, the chart CSS moved to `components/Chart.css`, every new string in `copy.ts` beside the old keys, `CoinHistogram` and `RecentRound` in `api-types.ts`; frontend typecheck, lint, 73 tests and build green |
| T2 | Backend: coin histogram (domain, test-first) and `GET /rounds?limit=20`; 02 §6, §7 | S2, C1, C2 | delegated | done | `feat(backend): add the coin histogram and the recent rounds`; writer (Sonnet): RED 6 of 6 `coinHistogram` tests (`not a function`), GREEN; 16 cases in `recentRounds.test.ts` (shape, order, limit and default, 400 for 0/21/abc/−1/1.5/empty, 401, another user's rounds, an open round absent and not leaked in body, headers or logs). Parent: the unit 4 test that expected `GET /rounds` to 404 rewritten to check the list without the open round. Backend 223 tests, typecheck, lint, build green |
| T3 | Play, reveal and chart | S1, S2 | delegated | done | `feat(frontend): restyle the play screen and the reveal`; writer (Sonnet): `callLine` RED 5 against the new strings, GREEN 11; the history settles from the sealed placement with a CSS transform. Parent, after a browser pass with the API mocked: the logo and the `Gráfica N` pill broke onto two lines at 390 px, so the number moved to the chips; at 390 × 664 the chart was 106 px, so a `short` variant tightens both blocks to 360 px: 270 px sealed and revealed at 390 × 844, 194 px at 390 × 664, no horizontal scroll, no `NaN` |
| T4 | Stats: verdict card, averages, coin histogram, hits and streaks, last 20 | S2, C1, C2 | delegated | done | `feat(frontend): restyle the stats screen with the coin histogram and the recent charts`; writer (Sonnet): RED 10 tests in 3 files (`statsView`, `monthYear`, `count`, `coinCardParts`), GREEN 100 with the other units. Parent: `coinParts` and its old sentences removed, the guard tests moved to `coinCardParts` with a complete-coin baseline (they had been passing for the missing histogram, not for the field they named), 19 unused copy keys deleted (two restored after `tsc` caught a regex that took the wrong ones). Browser at 390 px, API mocked: every card as in the design, no horizontal scroll, no `NaN`. Frontend 96 tests, typecheck, lint, build green |
| T5 | Welcome, log-in and the waking screen with its counter | S1, S2 | inline | done | `feat(frontend): restyle welcome, log-in and the waking screen`; `wakingSince()` RED 1 against a stub, GREEN 16 `api.test.ts`; `WelcomeChart` (seeded, CSS motion), `Logo` on every screen, the log-in form restyled, `ServerWaking` full screen with its counter outside the live region; eslint and tsc clean on these files. Browser pass in T6 |
| T6 | Integration: full suite once, browser pass at 390 px, RDD, 03 copy tables, `DECISIONS.md`, README, session log | all | inline | pending | |

Routes: T2, T3 and T4 are independent units with disjoint files, each several files and well over 100 lines, launched together after T1 (writer trigger: parallelism), and this session is past the advisory context size (backstop). The parent owns git, `copy.ts`, `globals.css`, `api-types.ts`, the specs and `DECISIONS.md`, checks each writer's diff against its surface, and runs one seam check at the end. T5 runs inline while the writers work.

## Log

- **L1** (2026-11-20 16:50 UTC, author's request, verbatim; the second part was pasted):

````text
crea una rama app style y vamos con con esto

Implement this design in this codebase:
https://claude.ai/code/artifact/37351e50-e5e9-4ba3-8e8a-d4afcf241e6c

Read the design's files from that link. Match how it looks, using this codebase's own components and conventions.
````

- **L2** (16:52 UTC) The AI listed what the design changes beyond the look (copy, Comprar on the left, data the app lacks) and asked how far to go. The author chose, among "Solo el aspecto (Recomendado)", "Aspecto y textos" and "Diseño completo":

````text
Diseño completo
````

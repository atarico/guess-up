# 02-market-data — Work unit 2: market data

Objective: work unit 2 of `prompts/specs/01-product.md` §15, as specified in `02-backend.md` §5.1–5.5 without the (P1) items. Branch: `main`, direct; one Conventional Commit per task; RDD assessment after each commit; the author pushes. Test runner: Vitest. pnpm 10, Node 24.

## Specs

Quoted from the author's request (L1), verbatim.

- **S1 Scope.** "Unidad 2 de la sección 15 de 01-product.md: datos de mercado. La especificación está en 02-backend.md, secciones 5.1 a 5.5. Lo marcado (P1) no entra." / "fetchQuote, liveQuoteService, --max-age-days, autenticación y rondas."
- **S2 Client and fake provider.** "El cliente de Twelve Data detrás de la interfaz MarketDataProvider, con fetchDailyCloses, los errores tipados y el timeout de 5.4. Y el proveedor falso que usan los tests."
- **S3 Credit budget.** "El presupuesto de créditos de 5.3, con el reloj inyectado."
- **S4 Snapshot write.** "La escritura de una serie como snapshot según 5.2, con sus reglas de rechazo."
- **S5 Universe.** "universe.ts con la lista que aprobé. Usala tal cual: si no la encontrás escrita en el repo o en Engram, frená y pedímela. No la rearmes de memoria."
- **S6 Seed.** "El script de seed de 5.5, idempotente y reanudable."
- **S7 Request log line.** "Aparte, como tarea y commit propios: la línea de log por pedido de 02 §8 que quedó pendiente de la unidad 1. Método, ruta sin query string, status y milisegundos. Nada de headers ni cuerpos."
- **S8 Real Twelve Data.** "Los tests usan el proveedor falso y no tocan la red ni la base." / "La sección 5.1 ya está verificada con llamadas reales. No la vuelvas a comprobar gastando créditos." / "Para probar el cliente real de punta a punta podés correr el seed de un solo símbolo: 1 crédito, cuando los tests estén en verde. Si hace falta un flag para eso (por ejemplo --only <símbolo>), agregalo y anotalo en 5.5." / "El seed completo lo corro yo: pasame el comando, cuánto tarda y cuántos créditos gasta." / "La key va por header y nunca aparece en logs, errores ni salidas."
- **S9 Process.** "Documento en odd/tasks/02-market-data.md antes de escribir código. Frená ahí, pasame el resumen en no más de 15 líneas y esperá mi ok." / "TDD, con rojo observado antes del verde, para el presupuesto de créditos y para la validación de la serie. El resto, con tests normales." / "Directo sobre main, un commit por tarea. El push lo hago yo." / "Hacé la evaluación de RDD en cada commit, como pide el protocolo, no al final." / "Si una respuesta real contradice 5.1, frená y mostrámela. No ajustes el código para que pase."
- **S10 Close.** "Un comando de verificación post-seed, de solo lectura: símbolos ready y failed, cantidad de velas y rango de fechas por símbolo, y los saltos de más de 40% de un día al otro." / "La sección Commands de CLAUDE.md actualizada, con la copia de prompts/system sincronizada." / "La sesión registrada en prompts/sessions/02-market-data.md."

Assumptions, pending the author's ok:

- **A1.** The seed calls `budget.acquire()` before every `fetchDailyCloses`, as 02 §5.5 writes it; the client itself does not know the budget. The seed is the only caller in this unit; the (P1) live quote will call `tryAcquire()` the same way.
- **A2.** Series validation is a pure function in `src/domain/series.ts` (drop the most recent bar, reject fewer than 400 bars or any non-positive close), written test-first. 02 §2 gains that file in its structure.
- **A3.** The daily counter is one atomic statement in `repositories/apiUsage.ts` (`insert … on conflict (day) do update set credits = credits + 1 where credits < cap returning credits`), injected into the budget so tests use an in-memory one. When the daily cap is reached, `acquire()` throws instead of waiting for the next UTC day; the seed stops and can resume later.
- **A4.** `DAILY_CREDIT_CAP` moves from `routes/health.ts` into `marketdata/creditBudget.ts`, as unit 1's A5 announced.
- **A5.** A symbol's series is stored in one transaction: delete its rows, insert all bars in one `insert … select unnest(…)` statement, update `symbols` (`ready`, bars, first and last date, `fetched_at`, `exchange` from `meta.exchange`).
- **A6.** Outcomes per symbol in the seed: `UpstreamLimitError` → retried once after the minute window clears (02 §5.4); `UpstreamNotFoundError`, `UpstreamUnavailableError` or a rejected series → `failed` (tried again on the next run); `UpstreamAuthError` → the whole seed stops, logged loudly.
- **A7.** The seed's logic is a function (`runSeed`) that takes the universe, provider, budget and repositories, so its idempotency and resume behaviour are tested with the fake provider and in-memory repositories. The CLI adds `--only <symbol>` for the 1-credit end-to-end run (02 §5.5 updated).
- **A8.** Client tests inject a `fetch` that returns canned responses shaped like the real ones recorded in 02 §5.1; no network. A test checks that no error message carries the API key.
- **A9.** The request log line is one middleware in `app.ts` that logs on the response's `finish` event: `METHOD /path STATUS 12ms`, with the path taken without its query string.
- **A10.** The post-seed check is `pnpm seed:check`, a read-only report: counts of `ready`/`failed`, bars and date range per symbol, and day-to-day moves above 40% (SQL with `lag()`).

## Tasks

| ID | Task | Specs | Route | Status | Commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T1 | Request log line (02 §8): method, path without query, status, ms; test | S7 | inline | done | `feat(backend): log one line per request`; 2 tests (failed before the middleware was wired, then passed); backend 29 tests green |
| T2 | `MarketDataProvider` interface, typed errors, fake provider | S2 | inline | done | `feat(backend): add the market data provider interface and fake provider`; 3 tests; `fetchQuote` left out (P1) |
| T3 | Credit budget (02 §5.3), clock injected, daily counter in `api_usage`; TDD with RED observed | S3, S9 | inline | done | `feat(backend): add the credit budget`; RED 6 failed against a stub ("not implemented") / GREEN 6 passed; daily counter as one atomic upsert in `repositories/apiUsage.ts`; `DAILY_CREDIT_CAP` moved from `routes/health.ts` |
| T4 | Twelve Data client `fetchDailyCloses`: header auth, 5 s timeout, error mapping (02 §5.4); tests with an injected `fetch` | S2, S8 | inline | pending | |
| T5 | Series validation (TDD with RED observed) and the snapshot write (02 §5.2) | S4, S9 | inline | pending | |
| T6 | `data/universe.ts` with the approved list, used as is | S5 | inline | **blocked**: list not found in the repo or Engram | |
| T7 | Seed (02 §5.5): `runSeed` + CLI with `--only`, idempotent and resumable; tests with fakes | S6, S8 | inline | pending | |
| T8 | End-to-end: `pnpm seed --only <symbol>` against Supabase and Twelve Data, 1 credit, after the tests are green; stop if a response contradicts 5.1 | S8 | inline | pending | |
| T9 | Post-seed check `pnpm seed:check` (read-only) | S10 | inline | pending | |
| T10 | `CLAUDE.md` Commands + `prompts/system` copy; the full-seed command, time and credits for the author | S8, S10 | inline | pending | |
| T11 | Session log `prompts/sessions/02-market-data.md` | S10 | inline | pending | |

Route evidence: no writer is delegated; the units depend on each other (provider → budget → client → storage → seed) and none needs parallel work.

## Log

- **L1** (2026-11-20, author's request, verbatim):

````text
Unidad 2 de la sección 15 de 01-product.md: datos de mercado. La especificación está en 02-backend.md, secciones 5.1 a 5.5. Lo marcado (P1) no entra.

Qué tiene que quedar funcionando
- El cliente de Twelve Data detrás de la interfaz MarketDataProvider, con fetchDailyCloses, los errores tipados y el timeout de 5.4. Y el proveedor falso que usan los tests.
- El presupuesto de créditos de 5.3, con el reloj inyectado.
- La escritura de una serie como snapshot según 5.2, con sus reglas de rechazo.
- universe.ts con la lista que aprobé. Usala tal cual: si no la encontrás escrita en el repo o en Engram, frená y pedímela. No la rearmes de memoria.
- El script de seed de 5.5, idempotente y reanudable.
- Aparte, como tarea y commit propios: la línea de log por pedido de 02 §8 que quedó pendiente de la unidad 1. Método, ruta sin query string, status y milisegundos. Nada de headers ni cuerpos.

Qué no entra
fetchQuote, liveQuoteService, --max-age-days, autenticación y rondas.

Twelve Data real
- Los tests usan el proveedor falso y no tocan la red ni la base.
- La sección 5.1 ya está verificada con llamadas reales. No la vuelvas a comprobar gastando créditos.
- Para probar el cliente real de punta a punta podés correr el seed de un solo símbolo: 1 crédito, cuando los tests estén en verde. Si hace falta un flag para eso (por ejemplo --only <símbolo>), agregalo y anotalo en 5.5.
- El seed completo lo corro yo: pasame el comando, cuánto tarda y cuántos créditos gasta.
- La key va por header y nunca aparece en logs, errores ni salidas.

Cómo quiero que corra ODD
- Documento en odd/tasks/02-market-data.md antes de escribir código. Frená ahí, pasame el resumen en no más de 15 líneas y esperá mi ok.
- TDD, con rojo observado antes del verde, para el presupuesto de créditos y para la validación de la serie. El resto, con tests normales.
- Directo sobre main, un commit por tarea. El push lo hago yo.
- Hacé la evaluación de RDD en cada commit, como pide el protocolo, no al final.
- Si una respuesta real contradice 5.1, frená y mostrámela. No ajustes el código para que pase.

Al cerrar
- Un comando de verificación post-seed, de solo lectura: símbolos ready y failed, cantidad de velas y rango de fechas por símbolo, y los saltos de más de 40% de un día al otro.
- La sección Commands de CLAUDE.md actualizada, con la copia de prompts/system sincronizada.
- La sesión registrada en prompts/sessions/02-market-data.md.
````

- **L2** (2026-11-20). Exploration. The approved universe is not written anywhere the author allowed: `git grep` finds the tickers together only in `prompts/sessions/00-spec-review.md`, which holds the author's prompts ("Universo: aprobado con un cambio. Sale KHC y entra CPB.") but not the table; Engram has only "Universe (60, KHC→CPB)". The table the author approved is in the AI's answer in the session 00 transcript (Claude Code's local file), which is neither the repo nor Engram. T6 is blocked until the author provides the list or allows that source. 02 §5.1–5.5 and §8 re-read as they stand after unit 1.
- **L3** (2026-11-20). The author: "Ok al plan y a los supuestos A1 a A10." / "Copia la tabla de acciones textual de la sesion 00, con KHC reemplazada por CPB. Ya la aprobe ahi, no me la vuelvas a mostrar." / "Segui sin frenar hasta el final de la unidad, salvo que algo cambie significativamente, la spec o gaste creditos de mas." The table was extracted by script from the session 00 transcript (60 rows, 20 marked as having done badly, the 11 sector names of 03 §3). The CPB row replacing KHC: name "The Campbell's Company" from the Twelve Data `/stocks` response saved in session 00 (its "Common Stock" suffix dropped, as in the other names), sector Consumer Staples, marked as having done badly as the session 00 note said.
- **Next:** T4.

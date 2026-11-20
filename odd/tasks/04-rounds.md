# 04-rounds — Work unit 4: domain and rounds API

Objective: work unit 4 of `prompts/specs/01-product.md` §15: the game's domain functions, written test-first, and the rounds API (`02-backend.md` §6, §7, §9), with the no-leak contract test on both the new and the resumed path. Branch: `main`, direct; one Conventional Commit per task; RDD after each commit, reviews run when due; the AI may push (tests green, no force, no `.env`). Test runner: Vitest with supertest. pnpm 10, Node 24.

## Specs

Quoted from the author's request (L1), verbatim.

- **S1 Scope.** "Unidad 4 de la sección 15 de 01-product.md: el dominio y la API de rondas. Está en 02-backend.md §6, §7 y §9." / Out: "GET /rounds/:id/live y GET /rounds, que son (P1). computeStats, la moneda y GET /stats, que van en la unidad 6. Nada de frontend."
- **S2 Domain, test-first.** "Dominio, con tests primero y rojo observado antes del verde: pickRound, normalise, isCorrect y la racha (actual y mejor)."
- **S3 API.** "POST /rounds (crear o reanudar) y POST /rounds/:id/decision (decisión y reveal), según 02 §7, con la racha en la respuesta de la decisión."
- **S4 Break the anonymity first.** "Antes de escribir código, buscá de qué formas alguien podría saber qué acción o qué fecha es antes de decidir. Como mínimo revisá: el cuerpo de la respuesta, los headers, los mensajes de error, los logs, el id de la ronda, el camino de reanudación, los propios puntos normalizados y lo que cualquier otro endpoint devuelva sobre una ronda abierta." / "Escribí la lista en odd/tasks/04-rounds.md y pasámela en el chat. Clasificá cada forma: la cubre un test, la cierra el diseño, o es un límite que se acepta y se documenta en 01 §12." / "Cubrí con tests las que apliquen y seguí sin esperarme. Frená solo si cerrar alguna obliga a cambiar el contrato de 02 §7."
- **S5 Tests (no network, no database).** "El test de no fuga de 02 §9, en los dos caminos: ronda nueva y ronda reanudada." / "La ronda reanudada devuelve el mismo id y los mismos puntos." / "Queda una sola ronda abierta aunque el pedido llegue dos veces." / "La segunda decisión no cambia la primera, y un body inválido no devuelve el reveal." / "La ronda de otro usuario da 404." / "Los límites de pickRound en los dos extremos y la serie demasiado corta."
- **S6 Production.** "Si la base no tiene símbolos ready, frená y avisame." / "Pasame los comandos curl para probar con mi usuario, con el token en una variable de mi shell y sin mostrarlo: crear una ronda, repetir el pedido, mandar dos pedidos a la vez, decidir, decidir de nuevo con la otra opción y pedir esa ronda con otro usuario. Con el resultado esperado de cada uno."
- **S7 ODD and review.** "No hace falta que frenes con el resumen: arrancá después de pasarme la lista de anonimato." / "Un commit por tarea sobre main. Podés pushear con las condiciones de siempre." / "RDD en cada commit, como pide el protocolo. Cuando corresponda una revisión, corréla. Con lo que encuentre: lo bloqueante, mostrámelo en una línea y arreglalo en su propio commit; lo demás, anotalo como pendiente en DECISIONS.md con el arreglo propuesto y seguí sin frenar. No lances el verificador independiente."
- **S8 Close.** "La sesión registrada en prompts/sessions/04-rounds.md."

Assumptions (the brief says to go on without waiting):

- **A1. Domain files as 02 §2:** `domain/pickRound.ts`, `domain/normalise.ts`, and `domain/stats.ts` holding `isCorrect` and `streaks`; `computeStats` joins that file in unit 6.
- **A2. Streak (01 §8: "consecutive right calls, current and best"):** over the user's decided rounds in decision order, `current` is the run of right calls at the end and `best` the longest run. "Right" is `isCorrect(decision, forwardReturn)` on the stored, frozen return (invariant 5).
- **A3. Layers:** `repositories/rounds.ts` (SQL only), read methods added to `repositories/closes.ts` and `repositories/symbols.ts`, `services/roundService.ts`, `routes/rounds.ts`. `createApp` deps gain `rounds`, `closes`, the symbol reads and `random` (`Math.random` in production; 02 §6 says the rng is injected everywhere).
- **A4. The race is decided by the database:** `insert … on conflict (user_id) where decision is null do nothing returning id`, inferring the partial unique index. No row back means another request opened a round first: read it and return it as resumed.
- **A5. Resume reads a fixed window:** only the 252 closes up to and including `cutoff_date`, so its cost does not depend on how long the stock's history is (vector V12).
- **A6. Decision order:** body validated first (`400 VALIDATION`, no database read); an `:id` that is not a UUID answers the same `404` as an unknown id; then `update … where id and user_id and decision is null returning …`; if nothing was updated, the caller's own decided round answers with its stored decision; anything else is `404`.
- **A7. Reveal:** name, sector and exchange from `symbols`; `history` the 252 `{ d, c }` up to the cutoff, `future` the next 63; `startDate`, `cutoffDate`, `endDate` from those rows; `forwardReturn` the stored value; `correct` from `isCorrect`.
- **A8. Types from Postgres:** dates read as `d::text` and numbers as `::float8`, never as JS `Date` objects (a local-time parse would shift a day, as `seedCheck` already avoids).
- **A9. SQL checked on a throwaway local Postgres** (Homebrew `pg_ctl`, data directory in the session scratchpad) before the push: the race, the update, the window queries. Production is not touched by the AI.
- **A10. Reviews:** "Cuando corresponda una revisión, corréla" is taken as the author's consent for every review due in this unit; the AI runs the provider's "granted" invocation without asking each time.
- **A11. Spec clarifications, no contract change** (02 §7 keeps its shapes): a non-UUID `:id` is `404`; resume reads the 252-row window; `GET /stats` will count decided rounds only (V10). Accepted limits go to 01 §12 (V11, V13).
- **A12. Production has 1 `ready` symbol** (`/status` → `symbolsReady: 1`, AAPL from unit 2). Not zero, so no stop (S6), but every round is AAPL until the author runs the full seed (V13).

## Anonymity: how the stock or the date could leak before the decision

Classes: **test** (an automated test fails if it leaks), **design** (the code has no path that could carry it), **limit** (accepted and written in 01 §12).

| # | Vector | How it could leak | Class | How it is closed |
| --- | --- | --- | --- | --- |
| V1 | Body of a new round | The service spreads a database row (`symbol`, `cutoff_date`, `forward_return`) into the response | test + design | Response built from an allow-list: `{ round: { id, points }, resumed }`. The no-leak test checks the exact key set, 252 numbers in [0, 1], and that the serialised body holds no symbol, no company name and no `YYYY-MM-DD` |
| V2 | Body of a resumed round | The resume path builds its answer differently from the create path | test | The same no-leak test on the resumed path; same id and same points as the first answer |
| V3 | Two requests at once | The loser of the race gets a database error (`500` with the constraint's detail) or a second open round | test + design | The partial unique index decides (A4); the loser reads the open round and returns it. Test: both requests in flight before either inserts → one open round, same id, both bodies pass the no-leak check |
| V4 | Response headers | A debug header, or an ETag built from something other than the body | test | No custom headers; the test serialises every header of the create and resume answers and checks for symbol, name and dates |
| V5 | Error messages | `NO_DATA`, `404`, `400`, or a `500` while rebuilding a round names the stock or the date | test + design | Messages are fixed strings; tests trigger `NO_DATA`, a broken rebuild (`500`), a `400` and a `404` and check every body |
| V6 | Logs | A service or the error handler logs the picked symbol, the cutoff, or a database error whose text carries them | test | Captured console output across create, resume, race, rebuild failure and invalid decision holds no symbol, name or date. The request log line already logs method, path, status and ms only |
| V7 | The round id | A sequential id or one derived from symbol and date (a hash) would carry information | design | `gen_random_uuid()` (random v4), the same in the in-memory test repository (`randomUUID`) |
| V8 | Decision with an invalid body | The handler builds the reveal before validating, or records an invalid decision | test | Body validated before any read; test: `400`, no `reveal` in the body, the round stays open (a later valid decision still works) |
| V9 | Decision on someone else's round, or on a made-up id | A `403`, or a different `404`, tells that the round exists; a non-UUID id makes Postgres throw a `500` | test + design | One `404` body for all three cases (another user's round, an unknown UUID, a non-UUID id) |
| V10 | Other endpoints | `GET /rounds/:id`, `/live`, `GET /rounds` or `GET /stats` describe an open round; stats that counted the open round's frozen return would move "buy everything" and reveal its direction | test + design | Only `POST /rounds` and `POST /rounds/:id/decision` exist in this unit; a test checks that `GET /rounds/:id` is a plain `404`. `/status` gives a count only; `/auth/me` nothing about rounds. 02 §7 now says `GET /stats` reads decided rounds only (unit 6), and the P1 endpoints already say "decided" |
| V11 | The normalised points | Min-max hides price level and amplitude, but not the shape. Someone holding the same public prices can slide the 252 points over every window of the 60 stocks (the universe is in the public repo) and find the match, stock and date | limit | 01 §12, new line: the game relies on the player not doing that; it only changes their own record. Not closed: any chart that keeps its shape can be matched |
| V12 | Timing | Loading a long history takes longer than a short one, so response time hints at the stock; the resume path can be asked again and again | design + limit | Resume reads exactly 252 rows (A5), so its time does not depend on the stock. Creating loads the whole series, once per round (no rerolls), a single noisy sample: accepted, in the same 01 §12 line |
| V13 | Universe size | With few `ready` symbols, the stock is a guess among few; `/status` publishes the count. Production now has 1, so every round is AAPL | limit + author action | The universe is public by design (01 §10); a 1-in-60 prior is accepted. Before anyone plays for real, the author runs `pnpm seed` (unit 2) |
| V14 | Recognisable market-wide events | A crash such as early 2020 dates the chart | limit | Already in 01 §12 ("Recognisable charts") |
| V15 | Reading the database directly | The Data API or the anon key reads `rounds` | design | RLS on with no policies, Data API off (02 §3, unit 1) |
| V16 | Points changing on resume | A series refreshed after a split rescales the closes, so a resumed chart could differ from the first | test + design | Min-max is scale-invariant: a test checks that multiplying every value by a positive factor leaves the output unchanged, so a split-adjusted refresh draws the same chart |

None of these needs a change to the 02 §7 contract.

## Tasks

| ID | Task | Specs | Route | Status | Commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T1 | This document, the anonymity list; 01 §12 and 02 §7 clarifications (A11) with `DECISIONS.md` | S4, S7 | inline | done | `docs: map how a round could leak its stock or date`; V1–V16 classified; list sent in the chat before any code; 01 §12 gains "A chart can be matched"; 02 §7: one `404` for unknown, foreign and non-UUID ids, body validated first, resume reads 252 rows, stats from decided rounds only |
| T2 | `normalise`, test-first (range, flat, length, scale invariance) | S2 | inline | done | `feat(backend): add normalise to the domain`; RED 5 of 5 failed against a stub that threw "not implemented" / GREEN 5 passed; typecheck, lint green |
| T3 | `pickRound`, test-first (both bounds, too short, arithmetic, never reads past `t + H`) | S2, S5 | inline | done | `feat(backend): add pickRound to the domain`; RED 8 of 9 failed against the stub (the passing one checks the constants) / GREEN 9 passed; the read guard test fails when the implementation maps the whole series (mutation observed, then restored); typecheck, lint green |
| T4 | `isCorrect` and `streaks`, test-first | S2 | inline | done | `feat(backend): add isCorrect and the streak to the domain`; RED 7 of 7 failed against the stub / GREEN 7 passed; `domain/stats.ts` holds both, with the `Decision` and `DecidedRound` types `computeStats` will reuse in unit 6; typecheck, lint green |
| T5 | Repositories, `roundService.createOrResume`, `POST /rounds`; tests V1–V7, V10, V16 on the API, S5 items 1–3 | S3, S4, S5 | inline | done | `feat(backend): create or resume a round with POST /rounds`; 11 tests in `test/rounds.test.ts`: 401 without token; the no-leak contract on a new round and on a resumed one (exact keys, 252 points in [0, 1], no symbol, name or `YYYY-MM-DD` in the body or any header, none in the logs); same id and points on resume; cutoff and frozen forward return stored at creation; stock first, then cutoff; resume reads 252 closes, never the whole series (V12); two requests held until both had looked → one open round, one `resumed: false` and one `true`, same id; each user their own round; `503 NO_DATA`; a round that cannot be rebuilt → `500` with no symbol or date in body or logs; `GET /rounds/:id` and `GET /rounds` are plain `404` (V10). The `NO_DATA` test found that the unit 3 error handler turned any `ApiError` of 500 or more into `500 INTERNAL`; fixed in this commit. Repositories: rounds (whole), symbol and close reads (dates as text, numbers as float8). 128 tests, typecheck, lint green |
| T6 | `POST /rounds/:id/decision`, reveal and streak; tests V8, V9, S5 items 4–5 | S3, S4, S5 | inline | done | `feat(backend): decide a round and reveal it`; 8 tests in `test/decision.test.ts`: 401; the reveal equals the stored data field by field (dates, 252 history, 63 future, frozen return, `correct`) with the streak; a second decision with the other option returns the same body and the stored `buy` stays; three invalid bodies → `400`, no `reveal`, no leak, round still open and decidable after; the same `404` body for another user's round, an unknown UUID and a non-UUID id, with the round left open; the streak across right, wrong, right calls. The in-memory rounds table now throws on a malformed UUID like Postgres, and the non-UUID case fails without the route's guard (mutation observed, then restored). 136 tests, typecheck, lint, build green |
| T7 | SQL on a throwaway local Postgres (A9); push; production curl commands for the author | S6 | inline | done | Local Postgres 16 (Homebrew, data directory in the scratchpad, TCP on localhost:55432), `001_init.sql` applied, the real app and repositories driven by a scratch script: the resume query failed on the reserved alias `window` → `fix(backend): stop using a reserved word in the resume query` (`964ce93`); after it: sealed create, resume with the same id and points, the race leaves one open round (`on conflict … where decision is null` returns no row on the second insert), `numeric(9,6)` keeps 0.123457, the reveal matches the stored row, the second decision keeps `buy`, the three `404` bodies are identical, the invalid body leaves the round open. Production commands under Author steps |
| T8 | Session log `prompts/sessions/04-rounds.md` | S8 | inline | pending | |

Route evidence: no writer is delegated; each task builds on the one before (domain → service → routes), and the brief rules out the independent verifier.

## Author steps

### Production checks (T7)

Run them after Render serves this unit (`curl -s https://guess-up-api.onrender.com/rounds -X POST` answers `401`, not `404`). Production has one `ready` stock today, so every round is AAPL; that does not change any result below. zsh, with `jq`.

**Setup.** Copy each token from the browser: DevTools → Application → Local Storage → the Vercel origin → `guess-up.token` (log in as your user, then as a second user in a private window). `read -rs` keeps them off the screen and out of the history; `curl` reads them from the variables.

```sh
API=https://guess-up-api.onrender.com
read -rs 'TOKEN?Token of your user: '; echo
read -rs 'OTHER?Token of the other user: '; echo
sealed() { jq -c '{keys: keys, resumed, points: (.round.points | length), inRange: (.round.points | all(. >= 0 and . <= 1))}'; }
leaks() { grep -cE 'AAPL|Apple|[0-9]{4}-[0-9]{2}-[0-9]{2}' || true; }
```

1. **Create a round.**
   ```sh
   R1=$(curl -s -X POST "$API/rounds" -H "Authorization: Bearer $TOKEN"); ID=$(print -r -- "$R1" | jq -r .round.id)
   print -r -- "$R1" | sealed; print -r -- "$R1" | leaks
   ```
   - Expected: `{"keys":["resumed","round"],"resumed":false,"points":252,"inRange":true}`, then `0`. `resumed` is `true` if you already had an open round; that is fine.
   - If it fails: other keys, or a non-zero count, is a leak (V1); `503 NO_DATA` means no stock is `ready`; `500` with a fresh deploy points at the SQL.
2. **Repeat the request.**
   ```sh
   R2=$(curl -s -X POST "$API/rounds" -H "Authorization: Bearer $TOKEN")
   print -r -- "$R2" | sealed; [[ $(print -r -- "$R2" | jq -r .round.id) == $ID ]] && echo same-id
   [[ $(print -r -- "$R1" | jq -c .round.points) == $(print -r -- "$R2" | jq -c .round.points) ]] && echo same-points
   ```
   - Expected: `"resumed":true`, `same-id`, `same-points`.
   - If it fails: a new id is a reroll (invariant 2); different points mean the rebuild reads a different window (V2, V16).
3. **Two requests at once,** with that round still open.
   ```sh
   for i in 1 2; do curl -s -X POST "$API/rounds" -H "Authorization: Bearer $TOKEN" | jq -c '{id: .round.id, resumed}' & done; wait
   ```
   - Expected: two lines, both with `$ID` and `"resumed":true`.
   - If it fails: a different id means a second open round.
4. **Decide.**
   ```sh
   curl -s -X POST "$API/rounds/$ID/decision" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"decision":"buy"}' \
     | jq -c '{symbol: .reveal.symbol, cutoff: .reveal.cutoffDate, end: .reveal.endDate, decision: .reveal.decision, r: .reveal.forwardReturn, correct: .reveal.correct, history: (.reveal.history | length), future: (.reveal.future | length), streak}'
   ```
   - Expected: `"symbol":"AAPL"`, real dates, `"decision":"buy"`, `history` 252, `future` 63, `correct` `true` exactly when `r` is above 0, and the streak.
   - If it fails: `404` means the id variable is empty or belongs to another user; `500` points at the reveal's SQL.
5. **Decide again with the other option.**
   ```sh
   curl -s -X POST "$API/rounds/$ID/decision" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"decision":"pass"}' | jq -c '{decision: .reveal.decision, r: .reveal.forwardReturn}'
   ```
   - Expected: `"decision":"buy"` and the same `r` as in step 4.
   - If it fails: `pass` means a decision was changed (invariant 2).
6. **Ask for that round as the other user,** next to a made-up id.
   ```sh
   curl -s -X POST "$API/rounds/$ID/decision" -H "Authorization: Bearer $OTHER" -H 'Content-Type: application/json' -d '{"decision":"pass"}' -w ' %{http_code}\n'
   curl -s -X POST "$API/rounds/00000000-0000-4000-8000-000000000000/decision" -H "Authorization: Bearer $OTHER" -H 'Content-Type: application/json' -d '{"decision":"pass"}' -w ' %{http_code}\n'
   ```
   - Expected: both lines `{"error":{"code":"NOT_FOUND","message":"Round not found"}} 404`.
   - If it fails: a reveal is a broken ownership check; a different body tells the other user that the round exists (V9).
7. **The real race,** now that no round is open (step 3 only resumed one).
   ```sh
   for i in 1 2; do curl -s -X POST "$API/rounds" -H "Authorization: Bearer $TOKEN" | jq -c '{id: .round.id, resumed}' & done; wait
   ```
   - Expected: two lines with the same new id, one `"resumed":false` and one `"resumed":true`. Over a real network one request may simply arrive after the other; the same id is what matters.
   - If it fails: two different ids mean two open rounds; a `500` means the conflicting insert was not absorbed.

Clean up after: `unset TOKEN OTHER R1 R2 ID`.

## Log

- **L1** (2026-11-20, author's request, verbatim):

````text
Unidad 4 de la sección 15 de 01-product.md: el dominio y la API de rondas. Está en 02-backend.md §6, §7 y §9.

Qué tiene que quedar funcionando
- Dominio, con tests primero y rojo observado antes del verde: pickRound, normalise, isCorrect y la racha (actual y mejor).
- POST /rounds (crear o reanudar) y POST /rounds/:id/decision (decisión y reveal), según 02 §7, con la racha en la respuesta de la decisión.

Qué no entra
GET /rounds/:id/live y GET /rounds, que son (P1). computeStats, la moneda y GET /stats, que van en la unidad 6. Nada de frontend.

Primero, intentá romper el anonimato
Antes de escribir código, buscá de qué formas alguien podría saber qué acción o qué fecha es antes de decidir. Como mínimo revisá: el cuerpo de la respuesta, los headers, los mensajes de error, los logs, el id de la ronda, el camino de reanudación, los propios puntos normalizados y lo que cualquier otro endpoint devuelva sobre una ronda abierta.
- Escribí la lista en odd/tasks/04-rounds.md y pasámela en el chat. Clasificá cada forma: la cubre un test, la cierra el diseño, o es un límite que se acepta y se documenta en 01 §12.
- Cubrí con tests las que apliquen y seguí sin esperarme. Frená solo si cerrar alguna obliga a cambiar el contrato de 02 §7.

Para darlo por terminado
Tests (sin red ni base):
- El test de no fuga de 02 §9, en los dos caminos: ronda nueva y ronda reanudada.
- La ronda reanudada devuelve el mismo id y los mismos puntos.
- Queda una sola ronda abierta aunque el pedido llegue dos veces.
- La segunda decisión no cambia la primera, y un body inválido no devuelve el reveal.
- La ronda de otro usuario da 404.
- Los límites de pickRound en los dos extremos y la serie demasiado corta.
Contra producción:
- Si la base no tiene símbolos ready, frená y avisame.
- Pasame los comandos curl para probar con mi usuario, con el token en una variable de mi shell y sin mostrarlo: crear una ronda, repetir el pedido, mandar dos pedidos a la vez, decidir, decidir de nuevo con la otra opción y pedir esa ronda con otro usuario. Con el resultado esperado de cada uno.

ODD y revisión
- Documento en odd/tasks/04-rounds.md. No hace falta que frenes con el resumen: arrancá después de pasarme la lista de anonimato.
- Un commit por tarea sobre main. Podés pushear con las condiciones de siempre.
- RDD en cada commit, como pide el protocolo. Cuando corresponda una revisión, corréla. Con lo que encuentre: lo bloqueante, mostrámelo en una línea y arreglalo en su propio commit; lo demás, anotalo como pendiente en DECISIONS.md con el arreglo propuesto y seguí sin frenar. No lances el verificador independiente.

Al cerrar
La sesión registrada en prompts/sessions/04-rounds.md.
````

- **L2** (2026-11-20). Exploration, no code. Read 01 §6–§8, §10, §12–§14, 02 §3, §6, §7, §9, the unit 2 repositories and `seedCheck`. Production `/status`: `{"ok":true,"db":true,"symbolsReady":1,…}`, so not zero (S6) but one stock only (V13). Local Postgres tools exist (`psql`, `pg_ctl`), so the SQL can be run for real without touching production (A9). The anonymity list (V1–V16) was written before any code; none of it needs a change to the 02 §7 contract.
- **L3** (2026-11-20). T1–T6 committed with TDD on the domain (RED 5/5, 8/9, 7/7). The `NO_DATA` test found that the unit 3 error handler turned any `ApiError` of 500 or more into `500 INTERNAL` (fixed in T5). The local Postgres found the reserved alias `window` in the resume query (fixed in `964ce93`). Each commit was assessed against the last boundary `97b50a9`: `medium`, `under_budget` up to 1,109 lines. The AI raised the slice with `--escalate-item 4` (the concurrent-create race, and the ownership guard that must not reveal another user's round), which made the review due. With the author's standing consent (A10), it ran four lenses (risk, resilience, readability, reliability): `approved` and acknowledged (lineage `review-b43fb569026903d3`); risk found nothing; seven non-blocking findings, none blocking, written to `DECISIONS.md` as pending with their proposed fixes.

# Session 04 — Work unit 4: domain and rounds API

- **Date:** 2026-11-20, 11:28 to about 11:55 UTC, in the same Claude Code session as unit 3.
- **Tool:** Claude Code 2.1.329, with the Gentle AI ODD rules, RDD reviews and Engram memory. No sub-agents; the brief ruled out the independent verifier. A local PostgreSQL 16 (Homebrew), with its data directory in the session scratchpad, was used for one check (T7). It was removed afterwards; production was not touched by the AI.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`).
- **Plan and logbook:** `odd/tasks/04-rounds.md`. It holds specs S1–S8 quoting the author, assumptions A1–A12, the anonymity list V1–V16, tasks T1–T8, the production checks (Author steps) and the log.
- **Time against the budget:** 01 §15 gives unit 4 40 minutes; the session took about 27 minutes up to this log, without the author's production checks.
- **Secrets:** none in this file.

## Prompts

The author's prompt is copied exactly as sent, extracted from the Claude Code transcript rather than retyped. The transcript holds it twice, at 11:28:38 and 11:28:59, with the same text; the AI answered once. The short outcome after it is not part of it.

### Prompt 1 — 11:28 UTC (pasted text)

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

**Outcome:**
- **Before any code, the anonymity list.** The AI checked production: `/status` showed 1 `ready` symbol, not zero, so it did not stop. Then it wrote the list of ways the stock or the date could leak before a decision (V1–V16) in `odd/tasks/04-rounds.md` and sent it in the chat, classified as test, design or accepted limit. None needed a change to the 02 §7 contract.
- **Accepted limits:** shape matching against public prices and the public universe, and the response time of creating a round. Both were added to 01 §12.
- **Spec made precise, same contract:** 02 §7 now says that a non-UUID id gets the same `404`, the body is validated first, resume reads 252 rows, and stats count decided rounds only.
- **Then T1–T7 ran without a stop,** as the brief allowed:
  - The domain was written test-first: RED observed before GREEN for `normalise` (5 of 5 failing), `pickRound` (8 of 9) and `isCorrect` with the streak (7 of 7).
  - `POST /rounds` and `POST /rounds/:id/decision` were built with the no-leak contract tested on both paths, including headers and logs.
  - The SQL was run against a throwaway local Postgres.
  - The RDD review covered the whole unit.
  - Everything was pushed, and the production checks were written for the author.

## The anonymity list, in short

| Class | Vectors |
| --- | --- |
| Covered by a test | V1 new round's body, V2 resumed round's body, V3 two requests at once, V4 headers, V5 error messages, V6 logs, V8 invalid decision body, V9 another user's round or an unknown or non-UUID id, V10 other routes, V16 points after a rescaled refresh |
| Closed by the design | V7 random UUID ids, V12 resume reads a fixed 252 rows, V15 RLS and the Data API off (unit 1), and the allow-list and fixed messages behind V1, V3, V5 and V9 |
| Accepted, in 01 §12 | V11 shape matching against public prices, V12 creation timing, V13 a small universe, V14 recognisable market-wide drops |

V13 also needs the author: production has one `ready` stock (AAPL), so every round is AAPL until `pnpm seed` runs.

## RDD

The first commits were assessed against `HEAD~1`. That was corrected to the last reviewed boundary (`97b50a9`) from T4 on, so the slice accumulated: `medium`, `under_budget` up to 1,109 lines. The unit touches two high-risk items: the race for the open round, which is concurrency (item 4), and the ownership guard on rounds. So the AI raised the slice with `--escalate-item 4`, and the review became due. The brief said to run reviews when due, which the AI took as consent (A10).

| Candidate | Lenses | Result | Findings and outcome |
| --- | --- | --- | --- |
| T1 to the SQL fix (`97b50a9..964ce93`, 21 files, 1,109 lines) | risk, resilience, readability, reliability | approved, acknowledged | Risk: none. Seven non-blocking findings: an open round stuck if its window ever cannot be rebuilt; a comment that overstates `closes.upTo`; no-leak helpers copied in two test files; `ApiError` passed through for any status; two names for the frozen return; `L` and `H` at use sites; no automated test for the repository SQL. All are in `DECISIONS.md` as pending, each with its proposed fix. None was blocking, so no fix commit came from the review. |
| The docs commit after the review (`096f9bc`) | — | `passive`, no review | — |

## What the AI got wrong / what was fixed by hand

- **The error handler written in unit 3 turned any `ApiError` of 500 or more into `500 INTERNAL`.** So `503 NO_DATA` could not reach a client. A test of this unit found it, and T5 fixed it.
- **The resume query used `window`, a reserved word in Postgres, as an alias.** In production, resuming a round would have answered `500`. The in-memory tests could not see it. Running the real repositories on a throwaway local Postgres did, and `964ce93` fixed it.
- **The test for a non-UUID id first proved nothing.** The in-memory rounds table accepted any id, while Postgres throws. The fake now throws like Postgres, and the test fails without the route's guard (checked by removing it).
- **RDD was first assessed per commit instead of against the last reviewed boundary.** Corrected from T4 on. The tool's own tier stayed `medium` for a change that holds a concurrency race; the AI raised it with an escalation rather than lower or skip the review.
- **Nothing was fixed by hand by the author in this unit.** The production checks (Author steps in `odd/tasks/04-rounds.md`) are theirs. They were not run when this log was written.
- **Not covered by tests:** the repository SQL, which no test may run against a database. It was checked once by hand (T7), and an opt-in database test is listed as pending.

## Resulting commits

On `main`, pushed together (`97b50a9..096f9bc`):

- `9212be1` docs: map how a round could leak its stock or date
- `5a33b43` feat(backend): add normalise to the domain
- `ab3cdb1` feat(backend): add pickRound to the domain
- `be9b02f` feat(backend): add isCorrect and the streak to the domain
- `b1464c3` feat(backend): create or resume a round with POST /rounds
- `3a7abeb` feat(backend): decide a round and reveal it
- `964ce93` fix(backend): stop using a reserved word in the resume query
- `096f9bc` docs: record the SQL check and the unit 4 review findings

This log is one more commit, made afterwards.

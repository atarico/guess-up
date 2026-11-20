# Session 08 — Work unit 8: the sleeping server

- **Date:** 2026-11-20, 15:47 to about 15:58 UTC, in the same Claude Code session as units 6 (fixes) and 7.
- **Tool:** Claude Code 2.1.329, with the Gentle AI ODD rules, RDD and Engram memory. No sub-agents and no independent verifier (the brief ruled it out). The browser checks ran with a cached `playwright-core` from a scratch script against `next dev`, with the whole API mocked in the browser and, for the 90 s case, the page's clock fast-forwarded. Nothing touched the production backend or database.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`).
- **Plan and logbook:** `odd/tasks/08-cold-start.md`: specs S1–S10 quoting the author, assumptions A1–A4, tasks T1–T3, the author steps and the log.
- **Time against the budget:** 01 §15 gives unit 8 10 minutes; the session took about 13, including the review.
- **Secrets:** none in this file.

## Prompts

The author's prompts are copied exactly as sent, extracted from the Claude Code transcript rather than retyped. The short outcome after each prompt is not part of it.

### Prompt 1 — 15:47 UTC (pasted text)

````text
Unidad 8 de la sección 15 de 01-product.md: el servidor dormido. Está en la primera fila de 03-frontend.md §8: el reintento en api.ts y la pantalla ServerWaking, con el texto de la spec desde copy.ts.

Qué tiene que quedar funcionando
- Si un pedido a la API lleva 3 segundos sin respuesta, aparece ServerWaking. Cuando llega la respuesta, la pantalla se va y la app sigue sola, sin que el usuario toque nada.
- La lógica vive en un solo lugar (api.ts) y vale para cualquier pedido: login, cargar una ronda, decidir, estadísticas.
- Si /status responde con db: false, la espera termina y se muestra el error genérico, como quedó en la decisión 8.

Tres precisiones que apruebo desde ya (spec y DECISIONS.md en el mismo commit)
- La pantalla no depende solo de /status. El pedido original sigue en curso; si la consulta de estado no responde, la app igual continúa cuando el pedido original contesta.
- Reintento automático solo cuando el servidor no llegó a atender: error de red, 502, 503 o 504. Cualquier otra respuesta se entrega tal cual, sin reintentar. Revisá contra 02 §7 que reintentar sea seguro en cada endpoint y decime si alguno no lo es.
- Tope de 90 segundos. Pasado ese tiempo se muestra el error genérico con el botón Reintentar. Nunca una espera sin fin.

Tests (con reloj y fetch falsos, sin red)
- Respuesta antes de los 3 segundos: la pantalla no aparece.
- Respuesta después de los 3 segundos: aparece, se va, y el resultado se entrega una sola vez.
- Error de red y después /status responde bien: se reintenta y sale bien.
- /status con db: false: error genérico.
- Se pasa el tope: error genérico con Reintentar.
- Un 401, un 409 o un 400: pasan sin reintento.

Cómo lo pruebo yo sin esperar a que Render se duerma
Pasame los pasos para mi máquina, con lo que tengo que ver en cada uno:
- Con el backend local apagado y prendido a mitad de la espera, para el camino del error de red.
- Con el pedido retenido unos 10 segundos, para el camino de la respuesta lenta. Si se puede con la limitación de red del navegador, mejor que agregar código.
No agregues demoras artificiales al backend para probar esto.

Para darlo por terminado
- Los dos caminos funcionan en mi máquina.
- Una prueba real contra producción: dejo pasar más de 15 minutos sin tráfico y entro desde el celular, en Brave con Shields encendido. Decime qué tengo que ver.
- El aviso se anuncia para lectores de pantalla y entra en 390 px.
- typecheck, lint, test y build en verde, y la búsqueda de control de 03 §11 vacía.

ODD y revisión
- Documento en odd/tasks/08-cold-start.md. Arrancá sin esperarme; frená solo si algo contradice la spec.
- Un commit por tarea sobre main. Mostrame los commits y el push lo hago yo.
- RDD en cada commit, como pide el protocolo. Cuando corresponda una revisión, corréla. Con lo que encuentre: lo bloqueante, mostrámelo en una línea y arreglalo en su propio commit; lo demás, anotalo como pendiente en DECISIONS.md con el arreglo propuesto y seguí sin frenar. No lances el verificador independiente.

Al cerrar
La sesión registrada en prompts/sessions/08-cold-start.md.
````

**Outcome:**
- **Before writing, two points reported:** `503 NO_DATA` is our own answer and 03 §8 shows it with its own message, so the retry rule reads S4's own words, "solo cuando el servidor no llegó a atender": a 502, 503 or 504 that carries our `error.code` is delivered (A1). And against 02 §7, only `POST /auth/register` can change on a retry: a lost answer after the account was created gives `409 EMAIL_TAKEN`.
- **T1 `api.ts`, test-first:** RED 5 of 10 against a stub, then GREEN. The 90 s test first passed against the stub, because the old code failed at once; it was tightened to check the failure comes at exactly 90 s.
- **RDD:** assessed `medium`; the AI raised it with item 4 (concurrency) and relayed the consent prompt.
- **T2 `ServerWaking`,** checked in the browser at 390 px in four cases.

### Prompt 2 — about 15:52 UTC (answer to the review consent prompt)

The AI relayed Gentle AI's consent envelope with the native question tool, translated, with both choices and their effects. The author selected:

````text
Revisar este cambio
````

**Outcome:** lenses risk, resilience and reliability on `af8908f..58de031`: approved and acknowledged, with two non-blocking findings in `DECISIONS.md`. The missing notice in the reviewed commit was resolved by the next commit. `/login?demo=1` replacing an existing session is pending, with a fix proposed.

## Done-when list of the brief, with the evidence

| Criterion | Evidence |
| --- | --- |
| Answer before 3 s: no screen | `lib/api.test.ts`: no notice and no `/status` call |
| Answer after 3 s: shows, goes, delivered once | Test: notice on at 3 s and off at the answer, one delivery, no retry, while `/status` never answered. Browser: a 10 s answer, the notice at 4 s, gone about 10 s in, one request |
| Network error, then `/status` up: retried, succeeds | Test and browser: the request is sent twice and the chart loads |
| `/status` with `db: false`: generic error | Test (`INTERNAL`, original aborted) and browser (`Algo salió mal. Intenta de nuevo.` with `Reintentar`) |
| Past the cap: generic error with `Reintentar` | Test: `NETWORK` at exactly 90 s, no requests after. Browser on the page's clock: the notice at 88.5 s, the error at 91.5 s, `Reintentar` loads the round |
| 401, 409, 400 pass without retry | Test, plus our `503 NO_DATA` |
| Announced to screen readers, fits 390 px | The `role="status"` region is on the page and empty before the wait, filled when it starts; no horizontal scroll at 390 px; screenshot |
| typecheck, lint, test, build; 03 §11 search empty | Backend 177 tests, frontend 58; all green; no bare `$` with a digit, no voseo, no literal text in components |
| Both paths on the author's machine; production after 15 minutes | The author's steps in `odd/tasks/08-cold-start.md`; not run when this log was written |

## RDD

- `2fdd386` (task document) passive. `58de031` (`api.ts`) `medium`, raised by the AI to item 4; the open slice `af8908f..58de031` was reviewed (Prompt 2). `83a1f30` (`ServerWaking`) `medium`, under budget.

## What the AI got wrong / what was fixed by hand

- **The 90 s test passed against the stub at first:** it only checked the final error, which the old code also gave, at once. Tightened to check the time of the failure before the implementation was written.
- **The test loop moved the clock to 90 s instead of 89 s** (30 steps of 3 s), so its own "still waiting" check failed; the arithmetic was fixed, not the code.
- **The first browser probe waited for the `Comprar` button,** which exists, disabled, while a round loads, so two cases were read too early. The probe now waits for the button to be enabled.
- **Unchecked times in the task document's log, again:** L3 said "about 16:05 UTC" at 15:55; corrected from the clock before the push.
- **Nothing was fixed by hand by the author.** Paths A and B and the production check are theirs and had not run when this log was written.

## Resulting commits

On `main`, not pushed (the author pushes), after those of sessions 06 (part 2) and 07:

- `2fdd386` docs(odd): open unit 8 with the retry-safety check
- `58de031` feat(frontend): wait for a sleeping server in api.ts
- `83a1f30` feat(frontend): show ServerWaking while a call waits

The author steps, this log and the closed task document are one more commit, made afterwards.

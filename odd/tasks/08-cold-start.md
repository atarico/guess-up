# 08-cold-start — Work unit 8: the sleeping server

Objective: work unit 8 of `prompts/specs/01-product.md` §15: the wake retry in `api.ts` and the `ServerWaking` screen (03 §8, first row; decision 8). Branch: `main`, one commit per task, the author pushes. Delivery: `ask-on-risk`. Tests: Vitest in `frontend/`, with fake timers and a fake `fetch`, no network.

## Specs

Quoted from the author's request (L1), verbatim.

- **S1 Scope.** "Unidad 8 de la sección 15 de 01-product.md: el servidor dormido. Está en la primera fila de 03-frontend.md §8: el reintento en api.ts y la pantalla ServerWaking, con el texto de la spec desde copy.ts."
- **S2 Behaviour.** "Si un pedido a la API lleva 3 segundos sin respuesta, aparece ServerWaking. Cuando llega la respuesta, la pantalla se va y la app sigue sola, sin que el usuario toque nada." / "La lógica vive en un solo lugar (api.ts) y vale para cualquier pedido: login, cargar una ronda, decidir, estadísticas." / "Si /status responde con db: false, la espera termina y se muestra el error genérico, como quedó en la decisión 8."
- **S3 Not only /status.** "La pantalla no depende solo de /status. El pedido original sigue en curso; si la consulta de estado no responde, la app igual continúa cuando el pedido original contesta."
- **S4 Retry only when not served.** "Reintento automático solo cuando el servidor no llegó a atender: error de red, 502, 503 o 504. Cualquier otra respuesta se entrega tal cual, sin reintentar. Revisá contra 02 §7 que reintentar sea seguro en cada endpoint y decime si alguno no lo es."
- **S5 Cap.** "Tope de 90 segundos. Pasado ese tiempo se muestra el error genérico con el botón Reintentar. Nunca una espera sin fin."
- **S6 Tests, fake clock and fetch.** "Respuesta antes de los 3 segundos: la pantalla no aparece." / "Respuesta después de los 3 segundos: aparece, se va, y el resultado se entrega una sola vez." / "Error de red y después /status responde bien: se reintenta y sale bien." / "/status con db: false: error genérico." / "Se pasa el tope: error genérico con Reintentar." / "Un 401, un 409 o un 400: pasan sin reintento."
- **S7 Author's local check.** "Con el backend local apagado y prendido a mitad de la espera, para el camino del error de red." / "Con el pedido retenido unos 10 segundos, para el camino de la respuesta lenta. Si se puede con la limitación de red del navegador, mejor que agregar código." / "No agregues demoras artificiales al backend para probar esto."
- **S8 Done when.** "Los dos caminos funcionan en mi máquina." / "Una prueba real contra producción: dejo pasar más de 15 minutos sin tráfico y entro desde el celular, en Brave con Shields encendido. Decime qué tengo que ver." / "El aviso se anuncia para lectores de pantalla y entra en 390 px." / "typecheck, lint, test y build en verde, y la búsqueda de control de 03 §11 vacía."
- **S9 ODD and review.** "Arrancá sin esperarme; frená solo si algo contradice la spec." / "Un commit por tarea sobre main. Mostrame los commits y el push lo hago yo." / "RDD en cada commit, como pide el protocolo. Cuando corresponda una revisión, corréla. Con lo que encuentre: lo bloqueante, mostrámelo en una línea y arreglalo en su propio commit; lo demás, anotalo como pendiente en DECISIONS.md con el arreglo propuesto y seguí sin frenar. No lances el verificador independiente."
- **S10 Close.** "La sesión registrada en prompts/sessions/08-cold-start.md."

## Assumptions

- **A1 A 502, 503 or 504 from our own API was served.** `POST /rounds` answers `503 NO_DATA` (02 §7), which 03 §8 shows with its own message. A 5xx whose body carries our `error.code` is delivered as is; only one without it (a proxy or the host) counts as not served (S4: "solo cuando el servidor no llegó a atender"). Render's own 502 and 503 carry no CORS headers, so a browser sees them as network errors anyway.
- **A2 When a retry happens.** After a network error or an unserved 5xx, the call waits for `/status` to answer `db: true`, then sends the request again. `/status` is asked when the screen appears (3 s) and every 3 s after, as 03 §8 says.
- **A3 The generic error.** Past 90 s the call fails with `NETWORK`; with `db: false`, with `INTERNAL`. Every screen already maps both to its own failure state: the generic error with `Reintentar` on `/play` and `/stats`, the generic error under the form on `/login` (its submit button is the retry), and `No se pudo guardar tu respuesta. Intenta de nuevo.` with the buttons enabled again after a decision (03 §8).
- **A4 One screen for every page.** `api.ts` counts the calls that have waited 3 s; `ServerWaking`, mounted once in the root layout, shows while that count is above zero. Its live region is on the page from the start and is filled when the wait begins, so screen readers announce it.

## Tasks

| ID | Task | Specs | Route | Status | Commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T1 | The wait in `api.ts`, test-first (S6); 03 §8 and `DECISIONS.md` with S3–S5 | S2–S6 | inline | pending | |
| T2 | `ServerWaking` with the 03 §8 text from `copy.ts`, in the root layout; browser check at 390 px | S1, S2, S8 | inline | pending | |
| T3 | RDD; all checks; the author's local and production steps; session log `prompts/sessions/08-cold-start.md` | S7–S10 | inline | pending | |

Route: inline for every task: one small unit each, and the author must explain it. No independent verifier (S9).

## Author steps

Filled at close.

## Log

- **L1** (2026-11-20 15:47 UTC, author's request, verbatim):

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

- **L2** (15:50 UTC) Retry safety against 02 §7, reported to the author: `POST /auth/register` is the one call a retry can change: if the account was created and the answer was lost to a network error, the retry gets `409 EMAIL_TAKEN`. `POST /auth/login` changes nothing (it counts toward the `/auth` rate limit); `GET /auth/me`, `GET /stats` and `GET /status` only read; `POST /rounds` creates or resumes the one open round; `POST /rounds/:id/decision` is idempotent (the first answer stands). A1 resolves the clash between "503" in S4 and `503 NO_DATA` in 03 §8 with S4's own rule.

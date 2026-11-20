# 09-polish — Work unit 9: the close

Objective: work unit 9 of `prompts/specs/01-product.md` §15: two pending fixes, the README and `prompts/README.md`, the closing checks, then the live price (P1, approved). Branch: `main`, one commit per task, the author pushes. Delivery: `ask-on-risk`. Tests: Vitest in each package; the live price uses the fake provider.

## Specs

Quoted from the author's request (L1), verbatim.

- **S1 Order.** "primero los dos arreglos, después los entregables obligatorios y recién después el precio en vivo. Así, si el tiempo no alcanza, lo que falta es opcional."
- **S2 P1 advice, no building.** "De los tres P1 que quedan (lista de últimas 20 rondas, ping diario y --max-age-days), decime en pocas líneas cuáles valen la pena y cuánto cuesta cada uno. Seguí trabajando; no construyas ninguno de los tres sin mi respuesta."
- **S3 Demo arrival.** "/login?demo=1 entra a la cuenta demo solo si no hay sesión abierta. Con sesión abierta el parámetro se ignora y el usuario sigue como estaba. Después de usarlo, el parámetro se quita de la URL para que recargar o volver atrás no lo dispare de nuevo."
- **S4 Arrow and number.** "La flecha no contradice al número. Si el valor se muestra como 0.0%, va sin flecha y en color tinta. Una sola función decide la dirección a partir del valor ya redondeado, y la usan el número, la flecha, el color y la etiqueta de accesibilidad." / "Marcá las dos entradas como resueltas." Each fix: "cada uno en su commit y con test"
- **S5 README.md.** "Qué es, para quién, y dónde se ven los datos financieros (en el reveal): quien evalúa los va a buscar." / "Las dos URLs públicas, las credenciales de la cuenta demo y que el registro es abierto." / "Cómo correrlo en local, paso a paso. Seguí tus propios pasos en un clon limpio hasta donde se pueda sin secretos y corregí lo que no ande." / "Arquitectura, y cómo se maneja el límite de la API." / "Decisiones y trade-offs, tomados de DECISIONS.md." / "Qué quedó afuera y por qué, las limitaciones conocidas de 01 §12 y qué haría con más tiempo, incluidos los pendientes de DECISIONS.md." / "Tiempo: dejá un marcador visible para que lo complete yo. No pongas ningún número." / "Reglas: no afirmes nada que no puedas señalar en el código, en las specs o en DECISIONS.md. Lo que no se construyó figura como no construido. Corto y para leer en diagonal: tablas donde ayuden, sin tono de venta."
- **S6 prompts/README.md.** "Herramientas y versiones: Claude Code v2.1.328 con Opus 5.5 en xhigh, Gentle-AI 4.6.0 con ODD y RDD, y los MCP que usaste. Decí la verdad sobre cada uno." / "Cómo trabajé: de la idea a la spec, la revisión de specs, una sesión por unidad con su plan en odd/tasks/, las revisiones y las pruebas contra producción." / "Un índice de prompts/sessions/ con qué se hizo en cada una, y dónde está en cada log lo que la IA hizo mal." / "Las specs y el CLAUDE.md los redacté con Claude (Fable 5.2) en claude.ai a partir de mi idea, y los prompts de cada unidad pasaron por una revisión ahí antes de mandártelos. Esa conversación la exporto yo a prompts/sessions/. Dejale el lugar en el índice y no inventes su contenido." / "Decime qué archivos de instrucciones globales estuvieron activos en estas sesiones (solo nombres y rutas, sin copiar el contenido), así decido si los sumo a prompts/system/."
- **S7 Closing checks.** "Los de 03 §11, y pasame la lista de la pasada manual para que la haga yo." / "Una tabla con los 10 criterios de aceptación de 01 §13: cumple o no, y la evidencia. Lo que no cumpla, decilo." / "Que haya un log por cada sesión, que prompts/system/CLAUDE.md sea idéntico al de la raíz, y una última búsqueda de secretos y de rutas con mi nombre de usuario en todo el repo y en el historial, sin mostrar valores." / "Mostrame los commits y pusheo yo. Con eso la entrega queda a salvo."
- **S8 Live price (P1).** "Tenés mi ok. Está en 02 §5.6, GET /rounds/:id/live de §7 y la línea en vivo de 03 §5.3. Los tests usan el proveedor falso. Al terminar, actualizá el README y DECISIONS.md."
- **S9 ODD and review.** "Un commit por tarea sobre main. RDD como en las unidades anteriores: lo bloqueante me lo mostrás y lo arreglás; lo demás va a DECISIONS.md. Sin verificador independiente. Al cerrar, la sesión en prompts/sessions/09-polish.md."

## Tasks

| ID | Task | Specs | Route | Status | Commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T0 | P1 advice in the reply, nothing built | S2 | inline | done | L2 |
| T1 | `/login?demo=1` only without a session; the parameter removed after use; test | S3 | inline | done | `fix(frontend): use ?demo=1 only without a session, then drop it`; RED 3 of 8 against a stub / GREEN: `demoArrival` waits while the session is unread, logs in only without one, ignores it with one or without credentials. Browser, API mocked: no session, one `POST /auth/login` and `/play`; a session open, no log in, the URL back to `/login`, the token unchanged; a failed demo log in, then a reload: no second log in |
| T2 | One function decides the headline's direction from the rounded number; test | S4 | inline | done | `fix(frontend): decide the headline's arrow from the number as shown`; RED 1 of 3 against a raw-value stub (±0.0004 got an arrow) / GREEN: `headline` for +12.0%, −8.0%, 0, ±0.0004 (`0.0%`, no arrow, ink) and ±0.0006 (±0.1%). Browser: a +0.04% reveal shows `0.0%` in `text-ink` with no arrow and is announced `0.0%. Compraste. Buena decisión.` 63 frontend tests, typecheck, lint green |
| T3 | `README.md`; local steps followed in a clean clone | S5 | inline | done | `docs: add the README`; a clean clone of `bb434b9` (Node 24.14.1, pnpm 10.33.0), no secrets: install, test (backend 177, frontend 63), typecheck, lint and build pass in both packages; pnpm warns `Ignored build scripts: esbuild`, harmless; without `.env` the backend names the missing variables and stops. Found while writing: the backend pins Supabase's root certificate (`src/db.ts`), so a plain local Postgres is refused, now stated. Two visible markers for the author: the demo password and the time spent |
| T4 | `prompts/README.md`; the global instruction files, names and paths only, in the reply | S6 | inline | done | `docs(prompts): add the prompts README`; versions checked: `claude --version` 2.1.329 (2.1.328 only in the first part of session 00, as its log says), `gentle-ai --version` 4.6.0; MCP use taken from each session log; a marked place for the author's claude.ai export |
| T5 | Closing checks: 03 §11, manual pass list, 01 §13 table, a log per session, `prompts/system/CLAUDE.md`, secrets and user paths in the tree and the history | S7 | inline | done | Backend 203 and frontend 73 tests, typecheck, lint and build green; 03 §11 searches empty; logs 00–08 present and 09 written here; `prompts/system/CLAUDE.md` identical to the root; no secret in the tree or in the 94 commits (only `.env.example` tracked; the URL-shaped strings are test fixtures and Supabase's own placeholder template; the 32-hex hits are the commit lines); `/home/<user>` only in `prompts/sessions/07-demo.md` (4 lines, from the author's pasted terminal output), the GitHub name in the repo URLs, and the author's name and email in commit metadata. The 01 §13 table is in L4 |
| T6 | Live price: `liveQuoteService`, `GET /rounds/:id/live`, the live line; README and `DECISIONS.md` | S8 | delegated | done | `feat: show today's price on the reveal`. Writer (Sonnet, background, one unit): backend RED on missing modules and `fetchQuote` (7 tests), GREEN 203 (from 177); frontend RED 5 `liveLine` tests, and the `optional` option's RED obtained after the fact by disabling it (4 of 5 failed; the fifth passes either way), GREEN 73 (from 63). It edited `services/roundService.ts`, outside its surface, to place `liveForRound` beside the decision rule; the parent accepted it. Parent review: a comment named the client's give-up as 5 s instead of 8 s (fixed). Browser at 390 px, API mocked: the four live states with no waking screen and one live call each; the limit note wrapped to two lines and shrank the chart from 460 to 448 px, against 03 §10; the bottom panel now reserves the line (`min-h-84`): the chart is 444 px sealed and revealed in every state at 390×844, and 264 px at 390×664. Backend 203, frontend 73, typecheck, lint and build green |
| T7 | Session log `prompts/sessions/09-polish.md` | S9 | inline | done | `docs(prompts): log session 09` |

Route: inline, except T6. T6 goes to one bounded writer under the long-session backstop: this session is far past the advisory context size, and T6 is a self-contained unit (its own spec sections, files and tests) that runs while the parent writes the docs. The parent owns git, reviews the diff against the declared surface, and writes the README and `DECISIONS.md` entries for it.

## Log

- **L1** (2026-11-20 16:04 UTC, author's request, verbatim):

````text
Unidad 9: el cierre. Orden de trabajo, porque la entrega es hoy: primero los dos arreglos, después los entregables obligatorios y recién después el precio en vivo. Así, si el tiempo no alcanza, lo que falta es opcional.

0. Al empezar, sin frenar
De los tres P1 que quedan (lista de últimas 20 rondas, ping diario y --max-age-days), decime en pocas líneas cuáles valen la pena y cuánto cuesta cada uno. Seguí trabajando; no construyas ninguno de los tres sin mi respuesta.

1. Dos pendientes de DECISIONS.md, cada uno en su commit y con test
- /login?demo=1 entra a la cuenta demo solo si no hay sesión abierta. Con sesión abierta el parámetro se ignora y el usuario sigue como estaba. Después de usarlo, el parámetro se quita de la URL para que recargar o volver atrás no lo dispare de nuevo.
- La flecha no contradice al número. Si el valor se muestra como 0.0%, va sin flecha y en color tinta. Una sola función decide la dirección a partir del valor ya redondeado, y la usan el número, la flecha, el color y la etiqueta de accesibilidad.
Marcá las dos entradas como resueltas.

2. Entregables
README.md, en inglés, con todo lo que pide la consigna:
- Qué es, para quién, y dónde se ven los datos financieros (en el reveal): quien evalúa los va a buscar.
- Las dos URLs públicas, las credenciales de la cuenta demo y que el registro es abierto.
- Cómo correrlo en local, paso a paso. Seguí tus propios pasos en un clon limpio hasta donde se pueda sin secretos y corregí lo que no ande.
- Arquitectura, y cómo se maneja el límite de la API.
- Decisiones y trade-offs, tomados de DECISIONS.md.
- Qué quedó afuera y por qué, las limitaciones conocidas de 01 §12 y qué haría con más tiempo, incluidos los pendientes de DECISIONS.md.
- Tiempo: dejá un marcador visible para que lo complete yo. No pongas ningún número.
Reglas: no afirmes nada que no puedas señalar en el código, en las specs o en DECISIONS.md. Lo que no se construyó figura como no construido. Corto y para leer en diagonal: tablas donde ayuden, sin tono de venta.

prompts/README.md, en inglés:
- Herramientas y versiones: Claude Code v2.1.328 con Opus 5.5 en xhigh, Gentle-AI 4.6.0 con ODD y RDD, y los MCP que usaste. Decí la verdad sobre cada uno.
- Cómo trabajé: de la idea a la spec, la revisión de specs, una sesión por unidad con su plan en odd/tasks/, las revisiones y las pruebas contra producción.
- Un índice de prompts/sessions/ con qué se hizo en cada una, y dónde está en cada log lo que la IA hizo mal.
- Las specs y el CLAUDE.md los redacté con Claude (Fable 5.2) en claude.ai a partir de mi idea, y los prompts de cada unidad pasaron por una revisión ahí antes de mandártelos. Esa conversación la exporto yo a prompts/sessions/. Dejale el lugar en el índice y no inventes su contenido.
- Decime qué archivos de instrucciones globales estuvieron activos en estas sesiones (solo nombres y rutas, sin copiar el contenido), así decido si los sumo a prompts/system/.

Chequeos de cierre
- Los de 03 §11, y pasame la lista de la pasada manual para que la haga yo.
- Una tabla con los 10 criterios de aceptación de 01 §13: cumple o no, y la evidencia. Lo que no cumpla, decilo.
- Que haya un log por cada sesión, que prompts/system/CLAUDE.md sea idéntico al de la raíz, y una última búsqueda de secretos y de rutas con mi nombre de usuario en todo el repo y en el historial, sin mostrar valores.
Mostrame los commits y pusheo yo. Con eso la entrega queda a salvo.

3. Precio en vivo (P1)
Tenés mi ok. Está en 02 §5.6, GET /rounds/:id/live de §7 y la línea en vivo de 03 §5.3. Los tests usan el proveedor falso. Al terminar, actualizá el README y DECISIONS.md.

ODD y revisión
Documento en odd/tasks/09-polish.md. Un commit por tarea sobre main. RDD como en las unidades anteriores: lo bloqueante me lo mostrás y lo arreglás; lo demás va a DECISIONS.md. Sin verificador independiente. Al cerrar, la sesión en prompts/sessions/09-polish.md.
````

- **L2** (16:06 UTC) P1 advice given in the reply, nothing built: the daily ping is worth it (about 10 minutes, a scheduled workflow; Supabase pauses a free project after a week without activity, 02 §10); the last 20 rounds are a maybe (about 40–50 minutes, an endpoint, the list, a date format); `--max-age-days` is not worth it for this delivery (about 20–30 minutes).

- **L3** (about 16:30 UTC) RDD on `44355a7`: assessed `medium`; the AI raised it with item 2 (the live route is an ownership and anonymity guard, written by a delegated writer), so the open slice `58de031..44355a7` was due. Consent relayed; the author chose "Revisar este cambio" (`granted`). Lenses risk, resilience, reliability, lineage `review-1b10e6f09e39c913`: approved and acknowledged, with four warnings, none blocking: the README in that commit still called the live price not built (resolved by the README commit), a quote whose close is null or empty would read as a price of 0, and two on credits (failures not cached, no per-user limit, concurrent first asks not merged). All four are in `DECISIONS.md`.

- **L4** (16:35 UTC) Closing checks (T5). Acceptance criteria of 01 §13:

| # | Criterion (01 §13) | Met | Evidence |
| --- | --- | --- | --- |
| 1 | Before a decision, only the id, 252 numbers in [0, 1] and `resumed` | Yes | `backend/test/rounds.test.ts`: the no-leak contract on a new and a resumed round (body, headers, logs); `live.test.ts`: an open round gets 409 with nothing leaked |
| 2 | A new request with one open returns it; two at once leave one | Yes | `rounds.test.ts`: "two requests at once leave one open round"; the partial unique index in `sql/001_init.sql` |
| 3 | A second decision does not change the first | Yes | `decision.test.ts`: "a second decision does not change the first" |
| 4 | The worked example of 01 §8 matches exactly | Yes | `stats.test.ts`: "matches the worked example of 01 §8 exactly" |
| 5 | The coin range is identical across reloads until a new decision | Yes | `statsRoute.test.ts`: "keeps the coin range on reload, and changes it when a new round is decided" |
| 6 | With the key invalid or the limit used up, play, reveal and stats still work; only the live price is absent | Yes, by construction and test | Rounds, decisions and stats never call the provider (`roundService`, `statsService` take no provider); `liveQuote.test.ts` and `live.test.ts`: over budget or any provider error gives `available: false` with `200`, and the reveal shows the muted note |
| 7 | At 390 px, one thumb; both buttons at least 56 px and equal | Yes | `DecisionButtons.tsx`: both `button button-secondary min-h-14` (56 px); checked at 390 px in units 5–9 |
| 8 | A new user reaches the first chart in under 30 s, backend awake | Not measured | No timing was recorded in any session; part of the author's manual pass |
| 9 | Public URLs; the README's demo credentials work; the demo shows a verdict without playing | Not yet | Both URLs are live and `seed:demo` printed `coin` in production (the author's run, session 07), but the README's demo password is still a marker for the author |
| 10 | Neutral Spanish, no voseo, `es-MX`, no bare `$` | Yes | All copy in `lib/copy.ts`; the 03 §11 searches are empty; `format.test.ts` pins `es-MX` and `USD` |

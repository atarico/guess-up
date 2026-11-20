# Session 09 — Work unit 9: the close

- **Date:** 2026-11-20, 16:04 to about 16:40 UTC, in the same Claude Code session as units 7 and 8.
- **Tool:** Claude Code 2.1.329, with the Gentle AI ODD rules, RDD and Engram memory. One sub-agent: a Sonnet writer for the live price (T6), in the background, with a declared edit surface; the parent reviewed its diff. Browser checks with a cached `playwright-core` from scratch scripts against `next dev`, the API mocked in the browser. Context7 was not used in this session.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`).
- **Plan and logbook:** `odd/tasks/09-polish.md`: specs S1–S9 quoting the author, tasks T0–T7, the review in L3 and the closing checks in L4.
- **Time:** not measured here; the author fills in the README.
- **Secrets:** none in this file. The demo password is not known to the AI; the README keeps a marker for it.

## Prompts

The author's prompts are copied exactly as sent, extracted from the Claude Code transcript rather than retyped. The short outcome after each prompt is not part of it.

### Prompt 1 — 16:04 UTC (pasted text)

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

**Outcome:**
- **The P1 advice first, nothing built:** the daily ping is worth it (about 10 minutes); the last 20 rounds are a maybe (40–50 minutes); `--max-age-days` is not worth it now (20–30 minutes).
- **T1 and T2, test-first, one commit each:** `demoArrival` (RED 3 of 8) and `headline` (RED 1 of 3), both checked in the browser; both `DECISIONS.md` entries marked resolved.
- **T3 and T4:** `README.md`, with the local steps followed on a clean clone, and `prompts/README.md`, committed before the live price, as the brief ordered.
- **T6, the live price:** delegated to one writer while the parent wrote the docs; reviewed, then fixed for a comment and for a layout defect the browser found.
- **RDD:** the AI raised the slice with item 2 (the live route is a guard) and relayed the consent prompt.
- **T5:** the closing checks; the acceptance table is below.

### Prompt 2 — about 16:27 UTC (answer to the review consent prompt)

The AI relayed Gentle AI's consent envelope with the native question tool, translated, with both choices and their effects. The author selected:

````text
Revisar este cambio
````

**Outcome:** lenses risk, resilience and reliability on `58de031..44355a7`: approved and acknowledged, with four warnings and none blocking. The stale README was resolved in the next commit. The quote with a null close and two credit-spending paths are pending in `DECISIONS.md`, with their fixes.

## Acceptance criteria of 01 §13

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

## RDD

- `da1ae86` passive. `c838d33`, `bb434b9` medium, under budget. `e712602`, `69aeea6` documentation. `44355a7` (live price) medium, raised by the AI to item 2; the open slice `58de031..44355a7` was reviewed (Prompt 2). `9d7c2fc` passive.

## What the AI got wrong / what was fixed by hand

- **The README draft had three errors, caught before its commit:** a pronoun for the author nobody had stated ("his idea"), "decisions 1–18" when `DECISIONS.md` numbers them from 4, and "5,000 closes, one credit each" when the credit is per request.
- **The README was committed before the live price, as ordered, and then went stale:** it still called the price not built and said that playing costs no credits. The review found it; `9d7c2fc` fixed both.
- **The delegated writer edited one file outside its declared surface** (`services/roundService.ts`, for `liveForRound`). It said so; the parent accepted the change. It also wrote the `optional` option of `api()` before its tests and produced the RED afterwards by disabling the option; one of its five tests passes either way.
- **A comment of the writer gave the client's give-up as 5 s; it is 8 s.** Fixed by the parent before the commit.
- **The live line's limit note takes two lines at 390 px and shrank the chart at the reveal** (460 to 448 px), against 03 §10. Not seen by the writer, which did not open a browser; found by the parent's measurement and fixed with one more line of panel height.
- **The first secrets search printed part of a host name in a Python error** (a Supabase pooler template with `<n>` in it, not a secret). Later searches printed only shapes and counts.
- **Nothing was fixed by hand by the author.** The demo password, the time spent and the claude.ai export are the author's to add.

## Resulting commits

On `main`, not pushed (the author pushes):

- `da1ae86` docs(odd): open unit 9
- `c838d33` fix(frontend): use ?demo=1 only without a session, then drop it
- `bb434b9` fix(frontend): decide the headline's arrow from the number as shown
- `e712602` docs: add the README
- `69aeea6` docs(prompts): add the prompts README
- `44355a7` feat: show today's price on the reveal
- `9d7c2fc` docs: describe the live price in the README and record its review

This log and the closed task document are one more commit, made afterwards.

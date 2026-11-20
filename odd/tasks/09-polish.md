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
| T1 | `/login?demo=1` only without a session; the parameter removed after use; test | S3 | inline | pending | |
| T2 | One function decides the headline's direction from the rounded number; test | S4 | inline | pending | |
| T3 | `README.md`; local steps followed in a clean clone | S5 | inline | pending | |
| T4 | `prompts/README.md`; the global instruction files, names and paths only, in the reply | S6 | inline | pending | |
| T5 | Closing checks: 03 §11, manual pass list, 01 §13 table, a log per session, `prompts/system/CLAUDE.md`, secrets and user paths in the tree and the history | S7 | inline | pending | |
| T6 | Live price: `liveQuoteService`, `GET /rounds/:id/live`, the live line; README and `DECISIONS.md` | S8 | delegated | pending | |
| T7 | Session log `prompts/sessions/09-polish.md` | S9 | inline | pending | |

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

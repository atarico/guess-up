# Session 05 — Work unit 5: play screen and reveal

- **Date:** 2026-11-20, 12:22 to about 12:45 UTC. Claude Code resumed the same conversation in a new session partway through the unit. The prompt and the work carried over, but the session scratchpad was cleared, so scratch work from then on used `mktemp -d`.
- **Tool:** Claude Code 2.1.329, with the Gentle AI ODD rules, RDD reviews and Engram memory. No sub-agents; the brief ruled out the independent verifier. The browser checks ran with a cached `playwright-core` from a scratch directory, not the Playwright MCP, which writes into the worktree. They ran against a scratch copy of the backend with the in-memory market of its tests, so no test users reached production.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`).
- **Plan and logbook:** `odd/tasks/05-play.md`. It holds specs S1–S10 quoting the author, assumptions A1–A13, tasks T1–T5, the phone checklist (Author steps) and the log.
- **Time against the budget:** 01 §15 gives unit 5 45 minutes; the session took about 23 minutes up to this log, without the author's phone checks.
- **Secrets:** none in this file.

## Prompts

The author's prompt is copied exactly as sent, extracted from the Claude Code transcript rather than retyped. The short outcome after it is not part of it.

### Prompt 1 — 12:22 UTC (pasted text)

````text
Unidad 5 de la sección 15 de 01-product.md: la pantalla de juego y la revelación. Está en 03-frontend.md §5.3, §6, §8 y §9, más las etiquetas de accesibilidad de §10 y el mapeo de sectores de §3. Reemplaza la página provisoria de /play.

Qué tiene que quedar funcionando
- La gráfica sellada y la revelada según §6, en SVG propio, sin librería de gráficos y sin ninguna lectura al tocar o pasar el cursor.
- Los dos botones con el mismo peso visual, el teclado en escritorio y la tarjeta del reveal según §5.3, con el aviso "Precios ajustados por splits." debajo de los precios.
- Los estados de §8 que aplican a esta pantalla: carga, error al guardar la decisión, sin datos, error genérico y sesión vencida.
- format.ts con tests de las cadenas exactas de §9, incluida la fecha con la zona horaria de México.

Qué no entra
- La línea del precio de hoy y su placeholder, que son (P1). Igual reservá el alto de la tarjeta para que nada salte entre la gráfica sellada y la revelada.
- La pantalla de servidor despertando, que es la unidad 8.
- GET /stats llega en la unidad 6. Hasta entonces la barra superior muestra la racha a partir de la respuesta de la decisión, y el número de gráfica queda para la unidad 6. No inventes un endpoint para eso.
- El enlace a Estadísticas y el de cerrar sesión también llegan en la unidad 6. No dejes enlaces que no llevan a nada.

Reglas de esta pantalla
- Antes de la decisión, el cliente no pide, no guarda y no escribe en consola nada más que la ronda.
- Los textos son los de la spec, sin cambiar ninguno, y salen todos de copy.ts. Si falta un texto para algún caso, proponémelo: no lo redactes solo.
- No agregues elementos que la spec no pide: ni ayudas, ni íconos, ni tutorial. Si algo de diseño no está definido, elegí lo más simple y anotalo en DECISIONS.md.

Para darlo por terminado
- Se juega con un pulgar a 390 px. Los dos botones se ven sin desplazar en un teléfono real, con la barra del navegador visible.
- El doble toque manda una sola decisión: se ve un solo pedido en la red.
- Si recargo con la ronda abierta, veo la misma gráfica.
- Con movimiento reducido activado, el reveal aparece de una vez.
- El foco pasa a "Siguiente gráfica" después de decidir, y el resultado se anuncia en la región aria-live.
- La búsqueda de control de 03 §11 da vacío: ningún "$" suelto, ningún texto en inglés, ningún voseo.
- typecheck, lint, test y build en verde.

ODD y revisión
- Documento en odd/tasks/05-play.md. Arrancá sin esperarme; frená solo si algo contradice la spec.
- Un commit por tarea sobre main. Podés pushear con las condiciones de siempre.
- RDD en cada commit, como pide el protocolo. Cuando corresponda una revisión, corréla. Con lo que encuentre: lo bloqueante, mostrámelo en una línea y arreglalo en su propio commit; lo demás, anotalo como pendiente en DECISIONS.md con el arreglo propuesto y seguí sin frenar. No lances el verificador independiente.

Al cerrar
- Una lista corta, de no más de ocho pasos, para probarlo yo en el celular contra producción, con lo que tengo que ver en cada uno. Incluí una pasada en Brave con Shields encendido.
- La sesión registrada en prompts/sessions/05-play.md.
````

**Outcome:**
- **Before any code:** the AI checked `Intl` with `es-MX` under Node 24. It gives the strings of 03 §9 as written; only the minus has to be swapped for the real sign.
- **Then, without a stop, as the brief allowed:**
  - `format.ts` test-first.
  - The SVG chart.
  - The play screen. It was probed in a headless browser before its commit, and one problem found there was fixed first.
  - The RDD review of the unit, then the docs, then the push.
- **One copy gap went to the author as a proposal,** not as new text: 03 §5.3 has no call line for a buy when the return is exactly zero.

## Done-when list of the brief, with the evidence

| Criterion | Evidence |
| --- | --- |
| Playable with a thumb at 390 px; both buttons visible with the browser bar showing | At 390 × 664 the buttons end at 648 px and the page does not scroll, sealed or revealed; `100svh` layout |
| A double tap sends one decision | One `POST …/decision` for a double tap (probe) |
| Reload with the round open shows the same chart | Identical polyline points before and after the reload (probe) |
| Reduced motion shows the reveal at once | 80 ms after the reveal: labels at opacity 1 and the future line fully drawn with reduced motion; opacity 0 and undrawn without it |
| Focus on `Siguiente gráfica`, result in the `aria-live` region | Focus checked after the decision; the region read e.g. `Subió +17.7%. Compraste. Buena decisión.` |
| 03 §11 copy search empty | No bare `$` with a digit, no voseo, no interface text outside `copy.ts` |
| typecheck, lint, test, build | Green in both packages (frontend 10 tests, backend 136) |
| Before the decision, nothing but the round | The only API call is `POST /rounds`; storage holds only the token; the console is empty |

## RDD

- **Every commit** was assessed against `ffda886`: `medium` and `under_budget`, up to 883 lines.
- **Escalation:** the AI raised the slice with item 6 (no committed test would catch a regression in the screen's behaviour), and the review became due. It ran with the author's standing consent: three lenses (resilience, readability, reliability), approved, acknowledged.
- **Seven non-blocking findings:**
  - Six are in `DECISIONS.md` as pending, each with its proposed fix:
    - an arrow that can disagree with a number rounded to `0.0%`;
    - the direction computed in two places;
    - no unit tests for `callLine` and `direction`;
    - bare pixel offsets in the chart labels;
    - invisible literal characters for `NBSP` and `MINUS`;
    - a wording slip in this unit's A6, corrected in the feature document.
  - One was checked and is not a defect: if the answer to a recorded decision is lost, the retry gets the stored reveal, because the backend answers a repeated decision that way (02 §7).
- **The docs commit after the review** was `passive`.

## What the AI got wrong / what was fixed by hand

- **`:hover` stuck after a tap on touch devices.** The screenshots showed `Siguiente gráfica` underlined and `Reintentar` greyed after a tap. Fixed before the commit: hover styles now apply only where hover exists.
- **A lint error before the commit.** A state update was reachable from an effect (`react-hooks/set-state-in-effect`). The round request now returns the next state, and the promise sets it.
- **One probe failure was the probe's own.** Its `addInitScript` wrote the valid token back on each reload, so the tampered-token check never saw a tampered token. A separate run showed the app goes to `/login?expired=1`.
- **`NBSP` and `MINUS` ended up as literal characters.** The AI wrote `' '` and `'−'` in its tool call, and the escapes were decoded when the file was written. The review found it; it is pending.
- **The headline arrow follows the raw return while the number is rounded** (`▲ 0.0%`). The review found it; it is pending.
- **Nothing was fixed by hand by the author in this unit.** The phone checklist (Author steps in `odd/tasks/05-play.md`) is theirs and was not run when this log was written. Production still had one `ready` stock.

## Resulting commits

On `main`, pushed together (`ffda886..7fa4cd9`):

- `7e9acd8` feat(frontend): add format.ts with the es-MX strings of 03 §9
- `3e36c5c` feat(frontend): add the hand-written SVG chart
- `5d1e73f` feat(frontend): add the play screen and the reveal
- `7fa4cd9` docs: record the unit 5 review findings and the phone checklist

This log is one more commit, made afterwards.

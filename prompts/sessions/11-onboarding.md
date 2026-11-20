# Session 11 — After the submission: the audit and the onboarding

- **Date:** 2026-11-20, from about 18:45 to 20:35 UTC, after the submission.
- **Tool:** Claude Code 2.1.329, with the Gentle AI ODD rules, RDD and Engram memory. One Sonnet subagent ran the read-only audit of the code against 03 §5 and §6. The parent read the unit 10 design canvas with the Artifact tool, and the unit 10 scope question from the session transcript. Browser checks used the Playwright MCP against `next dev`, with a fake API in the session scratchpad, so neither the production backend nor its database was touched.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`).
- **Plan and logbook:** `odd/tasks/11-onboarding.md` (branch `ux/onboarding`, from `fixes`).
- **Time:** about an hour and fifty minutes.
- **Secrets:** none in this file.

## Prompts

The author's prompts are copied exactly as sent. Answers given through the question tool are marked as such.

### Prompt 1 (pasted)

````text
Mejoras de orientación para quien entra por primera vez. Es trabajo posterior a la entrega: rama ux/onboarding que sale de fixes, con PR contra fixes, como quedamos.

Paso 1. Auditoría, sin tocar código
- Compará copy.ts y las pantallas contra 03-frontend.md §5 y §6, y listame toda diferencia con la spec. Ya sé de estas: Comprar a la izquierda y Pasar a la derecha, las flechas del teclado invertidas, la pregunta "¿Compras o pasas?", el botón de estadísticas solo con ícono, "pp" en lugar de "puntos", la gráfica sellada a todo el ancho, y el gráfico de la moneda como distribución en lugar de la banda de §5.4.
- Para cada una decime si fue una decisión, con el prompt o la sesión donde se tomó, o si se desvió sin decidirlo. No anotes como decisión algo que no lo fue: las que no tengan origen las decido yo, entre volver a la spec o aceptarlas.

Paso 2. Specs y textos, antes de codear
- Actualizá 01-product.md §5 y 03-frontend.md §5.3, §5.4 y §13. El principio deja de ser "sin tutorial" y pasa a ser "sin tutorial que frene el juego; una tarjeta corta la primera vez". Línea en DECISIONS.md con el motivo: quien entraba por primera vez no sabía qué se mide ni cuándo llega el veredicto.
- Los textos van en español neutro, de tú, sin voseo, y salen de copy.ts. Estas son mis propuestas. Armá una tabla con estas y con cualquier otro texto nuevo que haga falta:
  - Barra superior: "Estadísticas" y "Racha: 3 aciertos" (singular: "Racha: 1 acierto").
  - Progreso: las frases ya aprobadas, "Faltan 6 gráficas para tu primer veredicto." y "Falta 1 gráfica para tu primer veredicto."
  - Al llegar a 10: "Tu primer veredicto está listo en Estadísticas."
  - Tarjeta, línea 1: "Esta es la gráfica real de una acción, sin nombre ni fechas."
  - Tarjeta, línea 2: "Decide si la comprarías o la dejarías pasar. Después verás qué acción era y qué pasó."
  - Tarjeta, línea 3: "A las 10 gráficas recibes tu veredicto: si tu criterio le gana a lanzar una moneda."
  - Enlace: "¿Cómo funciona?"
  - Bajo el gráfico de la moneda: "Si ves dos montañas, es porque una sola acción se movió mucho: en algunos lanzamientos la moneda la compró y en otros no."
Frená acá, con la auditoría y la tabla de textos, y esperá mi ok.

Paso 3. Cambios, en este orden, un commit cada uno
1. El botón de estadísticas con el texto, como dice 03 §5.3, y la racha con su aclaración.
2. En la pantalla de juego, el progreso al veredicto, tomado de roundsUntilVerdict. Desaparece al llegar a 10. En el reveal de la gráfica con la que se llega a 10, aparece el aviso de que el veredicto está listo, con enlace a Estadísticas.
3. La tarjeta de tres líneas arriba de la gráfica, la primera vez que se juega en ese navegador, para que también la vea quien entra con la cuenta demo. Se va con la primera decisión. "¿Cómo funciona?" la vuelve a mostrar.
4. En Estadísticas, el botón para volver a jugar también arriba, con el mismo texto que el de abajo.
5. La frase bajo el gráfico de la moneda, y "puntos" en lugar de "pp" en toda la pantalla.
6. La zona del "?" en el 20% derecho de la gráfica sellada, como dice 03 §6, para que nada se corra al revelar.

Reglas
- Nada de esto empuja a comprar o a pasar, ni muestra ni guarda datos de la ronda abierta.
- Con la tarjeta visible, los dos botones se siguen viendo sin desplazar en un teléfono real.
- La lógica nueva (cuántas faltan, singular y plural, cuándo se muestra la tarjeta) va en funciones puras con su test.
- La búsqueda de control de 03 §11 da vacío. typecheck, lint, test y build en verde.

Para probar la rama
- Decime qué URL exacta sumo a CORS_ORIGIN en Render y qué variables tienen que estar cargadas en el entorno Preview de Vercel.
- Esa URL de prueba usa el backend y la base de producción. Avisame si algo de esta rama escribe datos que convenga no dejar ahí.
- Recordame sacar esa URL de CORS_ORIGIN después del merge.

ODD y RDD como siempre, sin verificador independiente. La sesión se registra en prompts/sessions/, en la sección posterior a la entrega.
````

**Outcome:** read-only. The audit and the copy table. The seven differences the author knew were differences from 03 as it stood before unit 10: unit 10 had rewritten §5.3, §5.4 and §6 to the design canvas in the same commits as the code. Their origins came from the unit 10 scope question, read from the transcript, and from the canvas. Three were named in that question and decided by "Diseño completo". Three came with the canvas without being named. The arrow keys were the AI's assumption. Twelve more differences were found (8–19). The branch `fixes` did not exist; the AI asked whether to create it.

### Prompt 2 (pasted)

````text
Respuestas, en el orden que pediste.

Rama
- Sí: creá fixes desde main (ea32269) y sacá ux/onboarding de ahí. PR contra fixes; lo mergeo yo.
- Antes de eso, decime qué commit corresponde a lo que entregué y creá ahí el tag anotado submission. No lo pushees sin que te lo pida.

Diferencias 4 a 7 (vinieron con el lienzo sin decidirse)
- 4: vuelve el texto "Estadísticas".
- 5: "puntos" en lugar de "pp". La leyenda "Tu ventaja, en puntos porcentuales" se queda, y §3 se ajusta para permitirla.
- 6: vuelve la zona "?" y nada se corre al revelar.
- 7: las flechas quedan como están, ← Comprar y → Pasar, porque siguen la posición de los botones en pantalla.
En DECISIONS.md anotá las cuatro con la fecha de hoy y con su origen real: llegaron con el lienzo de la unidad 10 sin que nadie las nombrara, y se decidieron después, en esta auditoría.

Diferencias 8 a 19
- 8, 9, 11, 13, 16, 17 y 18: la spec se pone al día con el código. Un solo commit de docs, el primero de la rama. En el 17 valen los 44 px, siempre que los dos botones de decisión sigan en 56.
- 12: arreglalo. Las flechas de Estadísticas llevan su etiqueta Subió / Bajó. Commit propio.
- 15: corregí el comentario viejo en el commit que toque ese archivo.
- 19: se resuelve con el 5.
- 10 y 14: no entran en esta rama. Anotalos como pendientes en DECISIONS.md. En el 10, el arreglo propuesto es que el veredicto no espere a la lista.

Textos
- Ok a la tabla, con estos ajustes:
  - Bajo la moneda va tu alternativa, para que coincida con el resto de la tarjeta: "Si ves dos montañas, es porque una sola acción se movió mucho: algunas monedas la compraron y otras no."
  - Sí a ocultar la pista mientras se ve la tarjeta, y a que toda la frase del aviso de la décima sea el enlace.
- Sumá a la tabla los textos accesibles que hoy tiene el código donde §10 quedó viejo, y mostrámelos antes de escribirlos en la spec. Es copy y lo reviso yo.

Los tres riesgos
- La barra: medila a 390 y a 320 px. Si no entra, primero se oculta la palabra "Guess-Up" y queda el ícono. Si todavía no entra, el pill vuelve a "Racha: 3" y la aclaración de qué es la racha pasa a la tarjeta de "¿Cómo funciona?". Lo que tiene prioridad es "Estadísticas" con texto.
- El aviso de la décima: mostralo solo si /stats trae un veredicto contra la moneda. Con todas compras o todos pases no hay veredicto, así que el aviso no aparece. Con test.
- Las specs: ok a tocar también 03 §3, §6 y §11.

Con esto tenés mi ok para el paso 3. Orden de commits: primero el de docs que pone la spec al día, después los seis cambios, después el 12. Lo de CORS y Vercel, cuando la rama esté publicada.
````

### Prompts 3 and 4 (answers through the question tool, in one dialog)

The AI asked which commit the tag `submission` goes on: `f1ba936`, the merge of PR #1 at 14:21 −03, or `ea32269`, the welcome fix pushed at 15:27. git does not record when the work was submitted. The author wrote:

````text
que sea un pr
````

The AI also showed the accessible texts for 03 §10, the old ones beside the ones the code uses. The author selected:

````text
Ok, así
````

**Outcome:** the tag on `f1ba936`, read as "the merge of the PR" (an interpretation, recorded as A1 in the logbook). Then the branches, the docs commit and changes 1 and 2.

### Prompt 5 (answer through the question tool)

The author had asked for the card above the chart. The AI built it there and measured it: at 390 × 664 the chart fell from 194 to 74 px, and at 320 × 568 the buttons left the screen. It then measured a second option: the card in the question block, in place of the chips and the hint. It showed both, with the numbers. The author selected:

````text
En el bloque (Recomendado)
````

**Outcome:** the card in the question block, then changes 4 to 6, the fix of the streak pill and item 12.

### Prompt 6

````text
Pushea la rama ux/onboarding y abri el PR contra fixes con gh. No mergees.
Antes arregla lo de la grafica de 78 px a 375 x 548 y confirmame si el tag submission incluye el README.
En la descripcion del PR pone que cambia, como probarlo y la URL de la rama que tengo que sumar a CORS_ORIGIN.
````

**Outcome:** the tag `submission` holds `README.md` as last changed by `35d9732`, the same README the branch has. A `tiny` variant for phones 600 px tall or less: 140 px of chart at 375 × 548, where it was 78 (`8bab444`). `fixes` and `ux/onboarding` pushed; `fixes` was needed as the PR's base and points at `ea32269`, already public on `main`. The tag was not pushed. The branch alias for `CORS_ORIGIN` was read from Vercel's commit status (scope and project) and checked: it redirects to Vercel's login, while an alias for a branch that does not exist answers 404. PR #2 opened against `fixes`, not merged.

## What the AI got wrong / what was fixed by hand

- **The streak pill read `Racha:6aciertos`.** Its text sat loose in a flex row, where each piece becomes a flex item and loses its edge spaces. Change 1 was committed that way; a screenshot showed it four commits later, and the fix is its own commit (`9533256`).
- **The card where the author asked for it did not fit a phone.** Built above the chart, it left a 74 px chart at 390 × 664 and pushed the buttons off a 320 × 568 screen. The AI measured it before committing and asked; the author chose the question block. The first version's rule, keeping the card through the first reveal, then had no reason to exist and was replaced by a simpler one.
- **The tenth chart's notice pushed `Siguiente gráfica` 24 px out of the block on a short phone.** Seen in the measurement and fixed before the commit: on short phones, and only on that chart, today's price row gives way to the notice.
- **`▼ −1.3 puntos` at the design's size overflowed its card at 320 px.** Measured before the commit; the value is now smaller and drops below its label when the row is too narrow.
- **The audit subagent's report had wrong line numbers, some past the end of their files (`DecisionButtons.tsx:246` in a 25-line file), and one false claim:** that `copy.play.live.today` was unused, when `lib/reveal.ts` uses it. The AI checked every finding against the code before reporting and dropped that one.
- **A `pkill -f` pattern matched the AI's own shell** and killed it, which left the fake API down for one check. It was restarted; nothing in the repository was affected.
- **ESLint caught a `setState` inside an effect** (reading the card's flag after hydration); it is resolved the way `lib/auth.tsx` already reads the token.
- **The first try at very short phones did not fit.** Tighter spacing and type alone left the block without the card needing 342 px of 310 at 375 × 548; the hint and today's price row had to go there. Each try was measured before the commit.
- **The tap area of `¿Cómo funciona?` could reach `Comprar` on a very short phone.** Its 44 px box reaches 12 px below its text. With the block full, that box overlapped the decision button, where a tap meant for the card would have bought. Found while measuring the `tiny` variant; the buttons now keep 12 px more below it.
- **The `branch-pr` skill was written for the Gentle AI repository** (an approved issue, `type:*` labels, a template). This repository has none of them, so only its generic rules were followed.
- **Nothing was fixed by hand by the author.**

## Resulting commits

On `ux/onboarding`, pushed, in PR #2 against `fixes` (the author merges). The tag `submission` (annotated, on `f1ba936`) stays local.

- `f6cf24c` docs: bring 03 up to the code and record the audit after the submission
- `56d33a3` feat(frontend): name the stats link and say what the streak counts
- `95a8d8b` feat(frontend): count down to the first verdict and say when it is ready
- `3c6398f` feat(frontend): show a short how-it-works card the first time
- `aa26df6` feat(frontend): put 'Jugar otra gráfica' below the verdict on Stats too
- `a12623d` feat(frontend): say 'puntos' on Stats and explain the coin's two humps
- `bade8f8` feat(frontend): bring back the question zone in the sealed chart
- `9533256` fix(frontend): keep the spaces in the streak pill
- `42edc74` fix(frontend): label the arrows on Stats for screen readers
- `6cb44cc` docs: close the onboarding work with its logbook and session log
- `8bab444` fix(frontend): give the chart room on very short phones

The logbook and this log, updated for prompt 6, are one more commit, made afterwards.

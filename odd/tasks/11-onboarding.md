# 11-onboarding — Orientation for a first-time player (after the submission)

Objective: a newcomer knows what is measured and when the verdict arrives, without a tutorial that holds up the game; plus the audit of the copy and screens against 03 §5 and §6. Branch `ux/onboarding` from `fixes` (`fixes` = `main` at `ea32269`); PR against `fixes`, the author merges; the author pushes. Delivery: `single-pr`. Tests: Vitest in `frontend/`; the new pure functions test-first.

## Specs

Quoted from the author (L1, L3, L4), verbatim.

- **S1 Branch and tag.** "rama ux/onboarding que sale de fixes, con PR contra fixes" / "creá fixes desde main (ea32269) y sacá ux/onboarding de ahí. PR contra fixes; lo mergeo yo." / "decime qué commit corresponde a lo que entregué y creá ahí el tag anotado submission. No lo pushees sin que te lo pida." Answer to the tag question: "que sea un pr" (see A1).
- **S2 Principle.** "El principio deja de ser "sin tutorial" y pasa a ser "sin tutorial que frene el juego; una tarjeta corta la primera vez". Línea en DECISIONS.md con el motivo: quien entraba por primera vez no sabía qué se mide ni cuándo llega el veredicto."
- **S3 Copy.** "Los textos van en español neutro, de tú, sin voseo, y salen de copy.ts." The table approved in L3 with its adjustments; the accessible texts of §10 approved in L4 ("Ok, así").
- **S4 Audit outcome, decided.** "4: vuelve el texto "Estadísticas"." / "5: "puntos" en lugar de "pp". La leyenda "Tu ventaja, en puntos porcentuales" se queda, y §3 se ajusta para permitirla." / "6: vuelve la zona "?" y nada se corre al revelar." / "7: las flechas quedan como están, ← Comprar y → Pasar, porque siguen la posición de los botones en pantalla." / "En DECISIONS.md anotá las cuatro con la fecha de hoy y con su origen real: llegaron con el lienzo de la unidad 10 sin que nadie las nombrara, y se decidieron después, en esta auditoría."
- **S5 Spec catch-up.** "8, 9, 11, 13, 16, 17 y 18: la spec se pone al día con el código. Un solo commit de docs, el primero de la rama. En el 17 valen los 44 px, siempre que los dos botones de decisión sigan en 56." / "15: corregí el comentario viejo en el commit que toque ese archivo." / "19: se resuelve con el 5."
- **S6 Pending.** "10 y 14: no entran en esta rama. Anotalos como pendientes en DECISIONS.md. En el 10, el arreglo propuesto es que el veredicto no espere a la lista."
- **S7 Change 1.** "El botón de estadísticas con el texto, como dice 03 §5.3, y la racha con su aclaración." Texts: "Estadísticas" and "Racha: 3 aciertos" (singular: "Racha: 1 acierto"). "La barra: medila a 390 y a 320 px. Si no entra, primero se oculta la palabra "Guess-Up" y queda el ícono. Si todavía no entra, el pill vuelve a "Racha: 3" y la aclaración de qué es la racha pasa a la tarjeta de "¿Cómo funciona?". Lo que tiene prioridad es "Estadísticas" con texto."
- **S8 Change 2.** "En la pantalla de juego, el progreso al veredicto, tomado de roundsUntilVerdict. Desaparece al llegar a 10. En el reveal de la gráfica con la que se llega a 10, aparece el aviso de que el veredicto está listo, con enlace a Estadísticas." Texts: "Faltan 6 gráficas para tu primer veredicto." and "Falta 1 gráfica para tu primer veredicto."; "Tu primer veredicto está listo en Estadísticas." "toda la frase del aviso de la décima sea el enlace". "El aviso de la décima: mostralo solo si /stats trae un veredicto contra la moneda. Con todas compras o todos pases no hay veredicto, así que el aviso no aparece. Con test."
- **S9 Change 3.** "La tarjeta de tres líneas arriba de la gráfica, la primera vez que se juega en ese navegador, para que también la vea quien entra con la cuenta demo. Se va con la primera decisión. "¿Cómo funciona?" la vuelve a mostrar." Texts: "Esta es la gráfica real de una acción, sin nombre ni fechas." / "Decide si la comprarías o la dejarías pasar. Después verás qué acción era y qué pasó." / "A las 10 gráficas recibes tu veredicto: si tu criterio le gana a lanzar una moneda." / "¿Cómo funciona?". "Sí a ocultar la pista mientras se ve la tarjeta".
- **S10 Change 4.** "En Estadísticas, el botón para volver a jugar también arriba, con el mismo texto que el de abajo."
- **S11 Change 5.** "La frase bajo el gráfico de la moneda, y "puntos" en lugar de "pp" en toda la pantalla." Text: "Si ves dos montañas, es porque una sola acción se movió mucho: algunas monedas la compraron y otras no."
- **S12 Change 6.** "La zona del "?" en el 20% derecho de la gráfica sellada, como dice 03 §6, para que nada se corra al revelar."
- **S13 Change 12.** "12: arreglalo. Las flechas de Estadísticas llevan su etiqueta Subió / Bajó. Commit propio."
- **S14 Rules.** "Nada de esto empuja a comprar o a pasar, ni muestra ni guarda datos de la ronda abierta." / "Con la tarjeta visible, los dos botones se siguen viendo sin desplazar en un teléfono real." / "La lógica nueva (cuántas faltan, singular y plural, cuándo se muestra la tarjeta) va en funciones puras con su test." / "La búsqueda de control de 03 §11 da vacío. typecheck, lint, test y build en verde."
- **S15 Order.** "Orden de commits: primero el de docs que pone la spec al día, después los seis cambios, después el 12."
- **S16 Testing the branch.** "Decime qué URL exacta sumo a CORS_ORIGIN en Render y qué variables tienen que estar cargadas en el entorno Preview de Vercel." / "Avisame si algo de esta rama escribe datos que convenga no dejar ahí." / "Recordame sacar esa URL de CORS_ORIGIN después del merge." / "Lo de CORS y Vercel, cuando la rama esté publicada."
- **S17 Process.** "ODD y RDD como siempre, sin verificador independiente. La sesión se registra en prompts/sessions/, en la sección posterior a la entrega."

## Assumptions

- **A1** "que sea un pr" read as: the tag goes on the merge of PR #1, `f1ba936`. Local and unpushed, so moving it costs nothing.
- **A2** Each change carries its own spec edits and `DECISIONS.md` line (the repository rule: the spec changes in the same commit); the first commit only brings 03 up to the code and records the audit.
- **A3** (superseded by L6) The card above the chart stays through the first reveal, so the chart's height does not change during it. The author then chose the question block, where the card simply goes with the decision.
- **A4** The tenth chart's notice asks `GET /stats` once, after the decision that leaves no chart to go; any failure means no notice.

## Tasks

| ID | Task | Specs | Route | Status | Commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T0 | Tag `submission`, branches `fixes` and `ux/onboarding` | S1 | inline | done | `submission` → `f1ba936` (annotated, local); `fixes` and `ux/onboarding` at `ea32269` |
| T1 | Docs: 03 up to the code (8, 9, 11, 13, 16, 17, 18), the audit in `DECISIONS.md` (4–7, pending 10 and 14), the old comment (15) | S4, S5, S6 | inline | done | `f6cf24c`; the old comment was in `login/page.tsx`, which no change touches, so it rides here |
| T2 | Change 1: `Estadísticas` as text, `Racha: N aciertos`; bar measured at 390 and 320 px | S7, S14 | inline | done | `56d33a3`, fixed in `9533256` (lost spaces); RED 4/4 `copy.test.ts`, GREEN. Bar: 362 of 358 px at 390 with the name, so below 420 px the mark alone; 287 of 288 px at 320 with `Racha: 128 aciertos`; 379 of 388 at 420 with the name |
| T3 | Change 2: progress to the verdict, the tenth chart's notice | S8, S14 | inline | done | `95a8d8b`; RED (module missing), GREEN 11 `progress.test.ts`. Browser: notice with a coin verdict, none with ten buys, progress gone at 10; at 390 × 664 the next button was 24 px out, so today's price row gives way there |
| T4 | Change 3: the first-time card and `¿Cómo funciona?`; 01 §5, 03 §13 | S2, S9, S14 | inline | done | `3c6398f`; RED, GREEN `howItWorks.test.ts` (rewritten after L6, RED 4 then GREEN). Card in the block: chart 270/194/78/170/98 px and buttons on screen without scrolling at 390 × 844, 390 × 664, 375 × 548, 360 × 640, 320 × 568 |
| T5 | Change 4: `Jugar otra gráfica` at the top of Stats | S10 | inline | done | `aa26df6`; on the first screen at 390 × 664 and 320 × 568, with 4 and 48 charts |
| T6 | Change 5: the two-humps sentence, `puntos` for `pp`; 03 §3 | S11, S4 | inline | done | `a12623d`; RED 3 `statsView.test.ts`, GREEN. The edge at 20 px: beside its label at 390 and 480, below at 320, no overflow |
| T7 | Change 6: the `?` zone in the sealed chart; 03 §6 | S12, S4 | inline | done | `bade8f8`; measured: largest x difference of the year between sealed and revealed 0 px, the cut line at the zone's edge in both |
| T8 | Change 12: `Subió`/`Bajó` on the Stats arrows | S13 | inline | done | `42edc74`; RED 2 `arrowLabel`, GREEN; the edge and both recent rows labelled in the browser |
| T10 | The chart on very short phones (L9) | L9 | inline | done | `8bab444`; the `tiny` variant: 140 px at 375 × 548 (was 78), 160 at 320 × 568 (was 98), every state of the block within 310 px, no scrolling; 390 × 664 unchanged; typecheck, lint, 117 tests, build |
| T11 | Publish: push, PR against `fixes` with what changes, how to test and the `CORS_ORIGIN` URL (L9) | L9, S16 | inline | done | `fixes` and `ux/onboarding` pushed, tag not pushed; PR #2; alias checked (302 to Vercel's login, a made-up alias 404) |
| T9 | Close: checks, browser pass, session log in the after-submission section, branch test notes | S14, S16, S17 | inline | done | frontend typecheck, lint, 117 tests, build; backend 223 tests; 03 §11 searches empty; `prompts/sessions/11-onboarding.md` and the section in `prompts/README.md`. Not done: a real phone (the author's) |

Routes: every unit is under about 100 changed lines and most share `copy.ts`, `PlayScreen.tsx` or the specs, so all run inline; no independent verifier (S17).

## Log

- **L1** (2026-11-20, author's request, pasted, verbatim):

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

- **L2** (AI, read-only) The audit and the copy table, without touching files. Findings: the seven known differences are against 03 before unit 10 (`44355a7`): unit 10 rewrote 03 §5.3, §5.4 and §6 in `dfb4bea` and `7d0bc36`, so changes 1 and 6 change the current spec rather than follow it. Origins, from the unit 10 scope question (session 10, prompt 3, the question tool's text) and the design canvas: Comprar on the left, `¿Compras o pasas?` and the histogram were named in the question; the icon-only stats link, `pp` and the full-width sealed chart came with the canvas without being named; the arrow keys were the AI's assumption (A1 of unit 10). Twelve more differences (8–19): code against spec, and 03 contradicting itself where unit 10 updated §5 and §6 but not §3 or §10. The branch `fixes` did not exist; the AI asked.
- **L3** (2026-11-20, author's answer, pasted, verbatim):

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

- **L4** (answers through the question tool, verbatim). The tag: the choices were `f1ba936` (merge of PR #1, 14:21 −03) and `ea32269` (the welcome fix, pushed 15:27); the author wrote `que sea un pr`. The accessible texts of §10 (sealed and revealed chart, the coin's histogram, `Acierto` / `Fallo`, `Cargando el precio de hoy`, the strip of the last 20, `Ver estadísticas` removed with the icon): `Ok, así`.
- **L5** T0 done: tag `submission` on `f1ba936` (A1), `fixes` and `ux/onboarding` at `ea32269`, nothing pushed.
- **L6** (answer through the question tool, verbatim). The card above the chart, measured: the chart 74 px at 390 × 664, the buttons off a 320 × 568 screen; in the question block: no change to the chart, the buttons on screen at the five sizes. The author selected `En el bloque (Recomendado)`.
- **L7** RDD after every commit: `gentle-ai review assess --base-ref ea32269 --committed-only`, untracked files excluded: medium, `review_due` false, `under_budget`, up to 617 changed lines; no review ran. No independent verifier (S17).
- **L8** (about 19:45 UTC) Closed: T0–T9 done on `ux/onboarding`, nothing pushed. Scratch removed: the fake API and the Playwright output (`.playwright-mcp/`). Next: the author pushes `fixes` and `ux/onboarding` (and the tag when asked), opens the PR against `fixes`, tests the preview on a real phone, and merges.
- **L9** (2026-11-20, author's request, verbatim):

````text
Pushea la rama ux/onboarding y abri el PR contra fixes con gh. No mergees.
Antes arregla lo de la grafica de 78 px a 375 x 548 y confirmame si el tag submission incluye el README.
En la descripcion del PR pone que cambia, como probarlo y la URL de la rama que tengo que sumar a CORS_ORIGIN.
````

- **L10** (about 20:35 UTC) The tag `submission` holds `README.md` as last changed by `35d9732`, unchanged since. T10 and T11 done: `8bab444`; `fixes` (needed as the PR's base, at `ea32269`) and `ux/onboarding` pushed; PR #2 against `fixes`, not merged. Branch alias `https://guess-up-frontend-git-ux-onboarding-ataricos-projects.vercel.app`, read from Vercel's commit status (scope `ataricos-projects`, project `guess-up-frontend`).

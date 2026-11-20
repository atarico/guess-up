# 05-play — Work unit 5: play screen and reveal

Objective: work unit 5 of `prompts/specs/01-product.md` §15: the play screen and the reveal (`03-frontend.md` §5.3, §6, §8, §9, the accessibility labels of §10 and the sector mapping of §3), replacing the provisional `/play`. Branch: `main`, direct; one Conventional Commit per task; RDD after each commit, reviews run when due; the AI may push (checks green, no force, no `.env`). Test runner: Vitest (frontend, `format.ts`). pnpm 10, Node 24.

## Specs

Quoted from the author's request (L1), verbatim.

- **S1 Scope.** "Unidad 5 de la sección 15 de 01-product.md: la pantalla de juego y la revelación. Está en 03-frontend.md §5.3, §6, §8 y §9, más las etiquetas de accesibilidad de §10 y el mapeo de sectores de §3. Reemplaza la página provisoria de /play."
- **S2 Chart.** "La gráfica sellada y la revelada según §6, en SVG propio, sin librería de gráficos y sin ninguna lectura al tocar o pasar el cursor."
- **S3 Buttons, keyboard, card.** "Los dos botones con el mismo peso visual, el teclado en escritorio y la tarjeta del reveal según §5.3, con el aviso "Precios ajustados por splits." debajo de los precios."
- **S4 States.** "Los estados de §8 que aplican a esta pantalla: carga, error al guardar la decisión, sin datos, error genérico y sesión vencida."
- **S5 Formatting.** "format.ts con tests de las cadenas exactas de §9, incluida la fecha con la zona horaria de México."
- **S6 Out.** "La línea del precio de hoy y su placeholder, que son (P1). Igual reservá el alto de la tarjeta para que nada salte entre la gráfica sellada y la revelada." / "La pantalla de servidor despertando, que es la unidad 8." / "GET /stats llega en la unidad 6. Hasta entonces la barra superior muestra la racha a partir de la respuesta de la decisión, y el número de gráfica queda para la unidad 6. No inventes un endpoint para eso." / "El enlace a Estadísticas y el de cerrar sesión también llegan en la unidad 6. No dejes enlaces que no llevan a nada."
- **S7 Screen rules.** "Antes de la decisión, el cliente no pide, no guarda y no escribe en consola nada más que la ronda." / "Los textos son los de la spec, sin cambiar ninguno, y salen todos de copy.ts. Si falta un texto para algún caso, proponémelo: no lo redactes solo." / "No agregues elementos que la spec no pide: ni ayudas, ni íconos, ni tutorial. Si algo de diseño no está definido, elegí lo más simple y anotalo en DECISIONS.md."
- **S8 Done when.** "Se juega con un pulgar a 390 px. Los dos botones se ven sin desplazar en un teléfono real, con la barra del navegador visible." / "El doble toque manda una sola decisión: se ve un solo pedido en la red." / "Si recargo con la ronda abierta, veo la misma gráfica." / "Con movimiento reducido activado, el reveal aparece de una vez." / "El foco pasa a "Siguiente gráfica" después de decidir, y el resultado se anuncia en la región aria-live." / "La búsqueda de control de 03 §11 da vacío: ningún "$" suelto, ningún texto en inglés, ningún voseo." / "typecheck, lint, test y build en verde."
- **S9 ODD and review.** "Arrancá sin esperarme; frená solo si algo contradice la spec." / "Un commit por tarea sobre main. Podés pushear con las condiciones de siempre." / "RDD en cada commit, como pide el protocolo. Cuando corresponda una revisión, corréla. Con lo que encuentre: lo bloqueante, mostrámelo en una línea y arreglalo en su propio commit; lo demás, anotalo como pendiente en DECISIONS.md con el arreglo propuesto y seguí sin frenar. No lances el verificador independiente."
- **S10 Close.** "Una lista corta, de no más de ocho pasos, para probarlo yo en el celular contra producción, con lo que tengo que ver en cada uno. Incluí una pasada en Brave con Shields encendido." / "La sesión registrada en prompts/sessions/05-play.md."

Assumptions (the brief says to start without waiting):

- **A1. Structure as 03 §2,** container and presentation apart: `app/play/PlayScreen.tsx` holds the requests, the state, the keyboard and the focus; `components/Chart.tsx`, `components/DecisionButtons.tsx` and `components/RevealCard.tsx` only draw what they are given. `app/play/ProvisionalPlay.tsx` is deleted.
- **A2. The chart is drawn in the pixels of its own box,** measured with a `ResizeObserver`, so the line, the dots and the labels stay sharp from 320 to 480 px. The ink line keeps `vector-effect: non-scaling-stroke` (§6). History spans the left 80%, the future the right 20%, 4% padding top and bottom, and a label band at the bottom reserved in both states so nothing moves at the reveal.
- **A3. The reveal sequence is CSS keyframes** whose last frame equals the element's normal style: a 200 ms cross-fade of the history line, the future line drawn with `stroke-dashoffset` over 900 ms, then the labels. Under `prefers-reduced-motion: reduce` the animations are off, so the final state shows at once.
- **A4. Layout:** the page is `100svh` tall, the small viewport, which is the visible height with the browser's bars showing. A 48 px top bar, the chart taking the rest, and a bottom panel of a fixed height that fits the reveal card, with one empty line reserved for the (P1) live price. Sealed, the question and the buttons sit at the bottom of that panel.
- **A5. Top bar in this unit:** only the streak, `Racha: N`, taken from the latest decision response. Before the first decision of a page load it is empty: there is no `GET /stats` yet (S6). No round count, no stats link, no log-out (S6).
- **A6. Labels on the revealed chart:** the start date left-aligned, the cutoff date centred under the cutoff, the end date right-aligned, all in the bottom band. The cutoff price sits just left of and above its dot, the end price right-aligned above its dot. There is no collision avoidance.
- **A7. Keyboard:** `←` pass and `→` buy while the chart is sealed. After the reveal, focus is on `Siguiente gráfica`, whose own `Enter` and `Space` work; a page-level `Enter`/`Space` also works when focus is not on a button. The key hints show only with a fine pointer.
- **A8. A failed decision** (any code but `UNAUTHORIZED`, which `api.ts` already handles) shows `No se pudo guardar tu respuesta. Intenta de nuevo.` and re-enables the buttons; the round is still open, so trying again is safe (§8).
- **A9. Headline:** `▲` when the return is above zero, `▼` below, no arrow at exactly zero; the arrow carries `Subió` or `Bajó` as its accessible label (§10).
- **A10. Missing copy, proposed and not written:** 03 §5.3 has no call line for a buy when the return is exactly zero ("Buy" has only "up" and "down"). Until the author gives the text, that case uses the "Buy, down" line, which matches how `isCorrect` scores it (a wrong buy).
- **A11. Sector and exchange line:** the sector through the §3 map, falling back to the raw value; a missing part is left out.
- **A12. Manual pass** with `playwright-core` in a scratch directory (not the Playwright MCP, which writes into the worktree), against a local scratch backend with the in-memory market of the backend tests, at 390 × 844 and 390 × 664 (the visible area of a phone with the browser bars showing), with reduced motion emulated for that check.
- **A13. Reviews:** as in unit 4, "Cuando corresponda una revisión, corréla" is consent for every review due in this unit.

## Tasks

| ID | Task | Specs | Route | Status | Commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T1 | `format.ts`, test-first, with the exact strings of 03 §9 and the date under `America/Mexico_City`; the §3 sector map in `copy.ts` | S5 | inline | done | `feat(frontend): add format.ts with the es-MX strings of 03 §9`; RED 9 of 10 failed against a stub (the passing one checks the time zone) / GREEN 10 passed; the two date tests fail when `timeZone: 'UTC'` is removed (mutation observed, then restored); sector map with the 11 names of 03 §3, raw value as fallback; typecheck, lint green |
| T2 | `Chart.tsx`, sealed and revealed (§6), CSS reveal sequence and reduced motion | S2 | inline | done | `feat(frontend): add the hand-written SVG chart`; sealed: ink polyline over the left 80%, dashed boundary and `?` in the right 20%, three unlabelled hairlines, no pointer handlers and no `<title>`; revealed: one scale over history and future, 200 ms cross-fade, future drawn with `pathLength=1` and `stroke-dashoffset` over 900 ms in `up` or `down`, then dates, prices and dots; reduced motion turns the animations off; the reveal and chart types added to `api-types.ts`; typecheck, lint, build green; checked by eye in T4 |
| T3 | Play screen: `PlayScreen`, `DecisionButtons`, `RevealCard`, states of §8, keyboard, focus, `aria-live`, top bar streak; provisional page removed; `DECISIONS.md` | S3, S4, S6, S7 | inline | pending | |
| T4 | Manual pass (A12), copy check (03 §11), all checks; push; phone checklist for the author | S8, S10 | inline | pending | |
| T5 | Session log `prompts/sessions/05-play.md` | S10 | inline | pending | |

Route evidence: no writer is delegated; the screen needs the formatter and the chart first, and the brief rules out the independent verifier.

## Author steps

### Phone checklist (T4)

Written at T4.

## Log

- **L1** (2026-11-20, author's request, verbatim):

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

- **L2** (2026-11-20). Exploration, no code. Read 03 §5.3 and §6 (and §3, §8–§11 again), and the unit 3 frontend: `api.ts`, `auth.tsx`, `copy.ts`, the provisional `/play`. `Intl` with `es-MX` under Node 24 (ICU 78.2) gives the §9 strings as written: `+2.1%`, `0.0%` for zero and for −0.0004, `1,234.56`, `12 mar 2019`; only the minus needs replacing (it comes out as a hyphen). Tailwind 4 has the `pointer-fine` variant for the key hints. Nothing contradicts the spec; one copy gap (A10) goes to the author as a proposal. The scratchpad of the session was cleared, so scratch work now uses `mktemp -d`.

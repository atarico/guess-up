# 12-tutorial — A guided tour the first time

Objective: a six-step guided tour of the play screen the first time a browser plays, replacing the first-time card of unit 11. Branch `tutorial`, from `main` at `bbe4f37`; not pushed. Tests: Vitest in `frontend/`, the new pure functions test-first.

## Specs

Quoted from the author (L1), verbatim.

- **S1 The tour.** "Un recorrido guiado de 6 pasos la primera vez que entro a Jugar, con un globo que senala cada parte, "Siguiente" y "Saltar". Reemplaza la tarjeta de bienvenida y el link "Como funciona?" lo vuelve a lanzar."
- **S2 The texts.** "Los textos son estos, sin cambiarlos:" 1. Grafica: "Esto es un año real de una accion. Le quitamos el nombre, las fechas y los precios: solo ves la forma." 2. Zona del "?": "Lo que paso en los tres meses siguientes esta tapado. Ahi esta la respuesta." 3. Comprar y Pasar: "Decide si la comprarias. Tu decision se guarda y no se puede cambiar." 4. Racha: "Tus aciertos seguidos: comprar y que suba, o pasar y que no suba." 5. Progreso: "A las 10 graficas ves tu veredicto: si tu criterio le gana a comprar todo." 6. Estadisticas: "Aqui ves tus resultados y te comparas con una moneda."
- **S3 Branch.** "implementalo en una rama que sea tutoria"

## Assumptions

- **A1** The branch is `tutorial` ("tutoria" read as a typo).
- **A2** The texts are shipped with their accents and opening marks (`acción`, `pasó`, `está`, `Ahí`, `comprarías`, `decisión`, `gráficas`, `Aquí`); no word changes. The copy rules of 03 §3 require correct Spanish.
- **A3** The last step's button reads `Listo`, a new string for the author to review; `Siguiente` would point at nothing.
- **A4** A step whose part is not on screen is passed over: the streak pill before `/stats` answers, the progress line from ten decided charts on (the demo account has forty).
- **A5** While the tour is open the page behind it is inert, so no tap, key or tab can buy or pass; `Escape` skips. The browser stores only that the tour was finished or skipped (`guess-up.tour.done`).

## Tasks

| ID | Task | Specs | Route | Status | Commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T1 | Tour: pure logic test-first, the component, the play screen; the card removed; 01 §5, 03 §5.3, §10, §11, §13, `DECISIONS.md`, README | S1, S2 | inline | done | `c2d22aa`; RED (module missing), GREEN 11 `tour.test.ts`; frontend typecheck, lint, 124 tests, build; 03 §11 searches empty. Browser at 390 × 844, 390 × 664, 375 × 548, 320 × 568: six steps (five with forty charts), every bubble inside the screen and off its part, focus on the main button, `ArrowLeft` on every step recorded no decision, `guess-up.tour.done` stored, page no longer inert after. RDD medium, `under_budget` |
| T2 | Close: checks, browser pass at phone sizes, session log; PR (L2) | S1–S3, L2 | inline | done | `prompts/sessions/12-tutorial.md`; branch pushed, PR against `main` |

## Log

- **L1** (2026-11-20, author's request; the first part was pasted, verbatim):

````text
Un recorrido guiado de 6 pasos la primera vez que entro a Jugar, con un globo que senala cada parte, "Siguiente" y "Saltar". Reemplaza la tarjeta de bienvenida y el link "Como funciona?" lo vuelve a lanzar.
Los textos son estos, sin cambiarlos:
1. Grafica: "Esto es un año real de una accion. Le quitamos el nombre, las fechas y los precios: solo ves la forma."
2. Zona del "?": "Lo que paso en los tres meses siguientes esta tapado. Ahi esta la respuesta."
3. Comprar y Pasar: "Decide si la comprarias. Tu decision se guarda y no se puede cambiar."
4. Racha: "Tus aciertos seguidos: comprar y que suba, o pasar y que no suba."
5. Progreso: "A las 10 graficas ves tu veredicto: si tu criterio le gana a comprar todo."
6. Estadisticas: "Aqui ves tus resultados y te comparas con una moneda."

 implementalo en una rama que sea tutoria
````

- **L2** (2026-11-20, sent while the AI was working, verbatim):

````text
ok arma el pr y subilo que lo mergeo
````

- **L3** (about 21:00 UTC) Closed. The PR goes against `main`, the branch `tutorial` came from (`fixes` is behind `main`). Not merged.

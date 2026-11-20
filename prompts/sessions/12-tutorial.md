# Session 12 — A guided tour (after the submission)

- **Date:** 2026-11-20, from about 20:45 to 21:00 UTC, in the same Claude Code session as session 11.
- **Tool:** Claude Code 2.1.329, with the Gentle AI ODD rules, RDD and Engram memory. Browser checks used the Playwright MCP against `next dev`, with a fake API in the session scratchpad; neither the production backend nor its database was touched.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`).
- **Plan and logbook:** `odd/tasks/12-tutorial.md` (branch `tutorial`, from `main` at `bbe4f37`).
- **Secrets:** none in this file.

## Prompts

The author's prompts are copied exactly as sent.

### Prompt 1 (the first part pasted)

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

**Outcome:**

- **The branch:** `tutorial`; the AI read "tutoria" as a typo.
- **Before writing code, the AI said three things:**
  - the texts would ship with their accents, with no word changed;
  - the last step needs a button other than "Siguiente", and `Listo` is for the author to review;
  - the request reverses the principle set earlier the same day, which the spec now states as a tour that can be skipped at every step.
- **The tour:** pure logic written test-first (`lib/tour.ts`: when it starts, which step comes next, where the bubble goes), the `Tour` component, and the play screen inert while the tour is open. The first-time card and its logic were removed.
- **Checked in a browser at four phone sizes:**
  - six steps, five on an account with forty decided charts;
  - every bubble inside the screen, none covering its part;
  - focus on the main button at every step;
  - no decision recorded by an arrow key sent at every step.

### Prompt 2 (sent while the AI was working)

````text
ok arma el pr y subilo que lo mergeo
````

**Outcome:** the branch pushed and a PR opened against `main`, the branch it came from; `fixes` is behind `main`. Not merged.

## What the AI got wrong / what was fixed by hand

- **The first layout of the tour would have used state set inside effects,** which the project's lint rule rejects (it caught that in session 11). The bubble's position is written to the elements after layout instead.
- **The bubble's arrow is faint against the dimmed screen.** It is the bubble's colour on a dark overlay; the lit box with its accent ring does the pointing. Left as is and noted here.
- **The JSX around the new fragment was left unindented** by the scripted edit; re-indented before the commit.
- **Nothing was fixed by hand by the author.**

## Resulting commits

On `tutorial`:

- `c2d22aa` feat(frontend): replace the first-time card with a guided tour
- the logbook and this log, in the commit that follows it

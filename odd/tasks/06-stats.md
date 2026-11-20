# 06-stats — Work unit 6: stats, the coin and their screen

Objective: work unit 6 of `prompts/specs/01-product.md` §15: `computeStats` and `coinBenchmark` written test-first, `GET /stats`, a pure frontend module that builds the verdict and coin sentences, and the stats screen (01 §8; 02 §6, §7 `GET /stats`, §9; 03 §5.4, §9, §10). Branch: `main`, direct; one Conventional Commit per task; RDD after each commit, reviews run when due; the AI may push (checks green, no force, no `.env`). Test runners: Vitest in both packages. One stop: the case table at step 4.

## Specs

Quoted from the author's request (L1), verbatim.

- **S1 Scope.** "Unidad 6 de la sección 15 de 01-product.md: las estadísticas, la moneda y su pantalla. Está en 01-product.md §8, en 02-backend.md §6 y GET /stats de §7, y en 03-frontend.md §5.4, más el formato de §9 y la etiqueta de la banda en §10." / Out: "La lista de últimas 20 rondas, que es (P1). El aviso de cuenta demo, que va en la unidad 7."
- **S2 Domain, test-first.** "Dominio, con tests primero y rojo observado antes del verde: computeStats y coinBenchmark, según 02 §6 y los tests de 02 §9."
- **S3 API.** "GET /stats según 02 §7." / "Las estadísticas cuentan solo rondas decididas. Con una ronda abierta, ningún número de /stats cambia: va con su test."
- **S4 Sentence module.** "Un módulo puro en el frontend que arme las frases del veredicto y de la moneda a partir de la respuesta de /stats, usando copy.ts y format.ts, con tests de la cadena exacta de cada estado de 03 §5.4."
- **S5 Stop with the case table.** "Frená y mostrame la tabla de casos de abajo. Esperá mi ok." / "Generala corriendo el código, no a mano. Un caso por cada estado: ventaja negativa dentro del rango de la moneda, ventaja positiva por encima del rango, por debajo del rango, ventaja que redondea a 0.0, menos de 10 rondas con varias por jugar, falta una sola, compró todo y no compró nada. Para cada uno: las rondas de entrada (decisión y rendimiento), los números calculados sin redondear, y las frases exactas del veredicto y de la moneda."
- **S6 Approved precision.** "Una precisión que apruebo desde ya (spec y DECISIONS.md en el mismo commit)" / "Los puntos que muestra la frase del veredicto son la resta de los dos porcentajes ya redondeados que aparecen en esa misma frase, para que la cuenta cierre a la vista. El veredicto contra la moneda usa la ventaja sin redondear. Si esa resta da 0.0, va la frase de "no cambió el resultado"."
- **S7 Screen.** "Recién entonces, la pantalla." / "En /play, la barra superior toma el número de gráfica y la racha inicial de GET /stats al cargar, y suma el enlace a Estadísticas." / "En Estadísticas, el enlace para cerrar sesión, y uno para volver al juego con el texto "Seguir jugando"."
- **S8 Done when.** "El ejemplo de 01 §8 da exacto." / "El rango de la moneda no cambia al recargar, y sí cambia cuando se decide una ronda nueva." / "Las frases son las aprobadas en 03 §5.4, sin cambiar ninguna, y salen de copy.ts." / "La banda de la moneda se entiende a 390 px, también cuando la marca del usuario cae fuera del rango." / "La búsqueda de control de 03 §11 da vacío. typecheck, lint, test y build en verde."
- **S9 ODD and review.** "El único freno es el del paso 4." / "Un commit por tarea sobre main. Podés pushear con las condiciones de siempre." / "RDD en cada commit, como pide el protocolo. Cuando corresponda una revisión, corréla. Con lo que encuentre: lo bloqueante, mostrámelo en una línea y arreglalo en su propio commit; lo demás, anotalo como pendiente en DECISIONS.md con el arreglo propuesto y seguí sin frenar. No lances el verificador independiente."
- **S10 Close.** "Una lista corta para probarlo en el celular contra producción." / "La sesión registrada en prompts/sessions/06-stats.md."

Assumptions (the brief stops only at step 4):

- **A1. Domain split.** `domain/coin.ts` holds `mulberry32`, `coinSeed(userId, decidedRounds)` (FNV-1a over both) and `coinBenchmark(returns, buys, seed, trials = 2000)`. `domain/stats.ts` gains `computeStats(rounds, coin)`. It receives the coin range because the verdict depends on it; the service runs the coin only when there is a verdict to make. 02 §6 is updated with that signature.
- **A2. Percentiles.** Sorted coin edges: `p5` is the one at index `floor(0.05·n)`, `p95` the one at `n − 1 − floor(0.05·n)`. With 2,000 trials, exactly 1,800 of them (90%) lie between the two, inclusive: "nueve de cada diez veces". `percentile` is the share of coin edges less than or equal to the user's edge (02 §6).
- **A3. Nulls.** `avgPicks` is null with no buys, `avgPassed` with no passes, `edge` with no buys. `coin` is null unless there is a verdict against it: at least 10 rounds, some buys and some passes. 02 §7 lists those nulls but not two more, which this unit adds: `avgAll` and `hitRate` are null with no decided rounds. `roundsUntilVerdict` is `max(0, 10 − rounds)`.
- **A4. Verdict order** (02 §6): `insufficient` under 10 rounds, then `bought_none` / `bought_all`, then `worse` (edge < p5), `better` (edge > p95), otherwise `coin`. The bounds themselves count as `coin`.
- **A5. Sentences** come from `copy.ts` as functions that return parts: plain text, and the figures that 03 §5.4 sets in bold monospace. `lib/verdict.ts` picks the state and fills the figures with `format.ts`.
- **A6. S6, the approved precision.** Each percentage is rounded once, to one decimal, half away from zero (the same rounding as `Intl`). The sentence shows those rounded numbers, and the points are their difference. That difference decides "costó", "sumó" or "no cambió"; the coin verdict keeps the raw edge.
- **A7. The coin's shares** ("superas al 96%", "te gana el 97%") are whole percents rounded down, so the claim is never overstated. A new formatter, `share`, is added to `format.ts` with its test. Hit rate uses it too.
- **A8. Missing figures:** a figure that is null shows `—` (no words), for example `Tus selecciones` with no buys.
- **A9. Stats screen** (03 §5.4, top to bottom, without the demo banner and without the P1 list): the verdict, the three figures, the coin band and its sentence, the secondary figures, the small print, then `Cerrar sesión` and `Seguir jugando`. With no coin, the coin section is left out. `Seguir jugando` is added to 03 §5.4 (author's text).
- **A10. The coin band** spans a scale that includes p5, p95, 0 and the user's edge, so the marker is always inside the drawing. The band's ends are labelled below it, the user's value above the marker, and the zero tick has no label. Its accessible name is the 03 §10 text.
- **A11. `/play` top bar:** `GET /stats` is called on load, alongside `POST /rounds`, and gives `Gráfica N` (`rounds + 1`) and the first streak. Once a decision has happened on the page, its response wins over a late `/stats` answer. `Estadísticas` sits on the right. Unit 5's rule ("before the decision, only the round") now admits this one read: it covers decided rounds only (S3).
- **A12. Reviews:** as in units 4 and 5, the brief's "Cuando corresponda una revisión, corréla" is consent for every review due in this unit.

## Tasks

| ID | Task | Specs | Route | Status | Commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T1 | `coinBenchmark` and its seed, test-first (02 §9 cases) | S2 | inline | done | `feat(backend): add the seeded coin benchmark to the domain`; RED 10 of 10 failed against a stub / GREEN 10 passed: same seed same result and another seed different, 2,000 trials, p5 ≤ 0 ≤ p95 on a mixed sample, ≥ 1,800 trials inside [p5, p95], zero spread when buying all, each edge = mean(chosen) − mean(all), without replacement, input untouched; typecheck, lint green |
| T2 | `computeStats`, test-first (worked example, no buys, all buys, streak, verdict thresholds, nulls) | S2, S8 | inline | done | `feat(backend): add computeStats to the domain`; RED 10 of 10 new tests failed against a stub / GREEN 17 passed (with the 7 earlier ones): the worked example of 01 §8 exact (picks 0.025, all 0.0375, passed 0.05, edge −0.0125, hit rate 0.25), no rounds all null, under 10 → insufficient before anything else, bought_none, bought_all, worse/better/coin with the bounds as coin, percentile = share ≤ edge, hit rate with a pass at zero right, refuses to judge without the coin; 02 §6 signature and percentile definition updated |
| T3 | `GET /stats`: service, route, tests (open round changes nothing, coin stable on reload and new after a decision); 02 §6, §7 updated | S3, S8 | inline | pending | |
| T4 | `lib/verdict.ts`, the 03 §5.4 sentences in `copy.ts`, `format.share`; exact-string tests; S6 in 03 §5.4 and `DECISIONS.md` | S4, S6 | inline | pending | |
| T5 | Case table generated by running the code; stop for the author's ok | S5 | inline | pending | |
| T6 | Stats screen, `Verdict`, `CoinRange`; `/play` top bar; `Cerrar sesión`, `Seguir jugando`; `DECISIONS.md` | S7, S8 | inline | pending | |
| T7 | Manual pass at 390 px, copy check, all checks; push; phone checklist | S8, S10 | inline | pending | |
| T8 | Session log `prompts/sessions/06-stats.md` | S10 | inline | pending | |

Route evidence: no writer is delegated; each task builds on the one before, and the brief rules out the independent verifier.

## Author steps

### Phone checklist (T7)

Written at T7.

## Log

- **L1** (2026-11-20, author's request, verbatim):

````text
Unidad 6 de la sección 15 de 01-product.md: las estadísticas, la moneda y su pantalla. Está en 01-product.md §8, en 02-backend.md §6 y GET /stats de §7, y en 03-frontend.md §5.4, más el formato de §9 y la etiqueta de la banda en §10.

Orden de trabajo
1. Dominio, con tests primero y rojo observado antes del verde: computeStats y coinBenchmark, según 02 §6 y los tests de 02 §9.
2. GET /stats según 02 §7.
3. Un módulo puro en el frontend que arme las frases del veredicto y de la moneda a partir de la respuesta de /stats, usando copy.ts y format.ts, con tests de la cadena exacta de cada estado de 03 §5.4.
4. Frená y mostrame la tabla de casos de abajo. Esperá mi ok.
5. Recién entonces, la pantalla.

La tabla de casos (paso 4)
Generala corriendo el código, no a mano. Un caso por cada estado: ventaja negativa dentro del rango de la moneda, ventaja positiva por encima del rango, por debajo del rango, ventaja que redondea a 0.0, menos de 10 rondas con varias por jugar, falta una sola, compró todo y no compró nada. Para cada uno: las rondas de entrada (decisión y rendimiento), los números calculados sin redondear, y las frases exactas del veredicto y de la moneda.

Una precisión que apruebo desde ya (spec y DECISIONS.md en el mismo commit)
Los puntos que muestra la frase del veredicto son la resta de los dos porcentajes ya redondeados que aparecen en esa misma frase, para que la cuenta cierre a la vista. El veredicto contra la moneda usa la ventaja sin redondear. Si esa resta da 0.0, va la frase de "no cambió el resultado".

Qué entra además
- Las estadísticas cuentan solo rondas decididas. Con una ronda abierta, ningún número de /stats cambia: va con su test.
- En /play, la barra superior toma el número de gráfica y la racha inicial de GET /stats al cargar, y suma el enlace a Estadísticas.
- En Estadísticas, el enlace para cerrar sesión, y uno para volver al juego con el texto "Seguir jugando".

Qué no entra
La lista de últimas 20 rondas, que es (P1). El aviso de cuenta demo, que va en la unidad 7.

Para darlo por terminado
- El ejemplo de 01 §8 da exacto.
- El rango de la moneda no cambia al recargar, y sí cambia cuando se decide una ronda nueva.
- Las frases son las aprobadas en 03 §5.4, sin cambiar ninguna, y salen de copy.ts.
- La banda de la moneda se entiende a 390 px, también cuando la marca del usuario cae fuera del rango.
- La búsqueda de control de 03 §11 da vacío. typecheck, lint, test y build en verde.

ODD y revisión
- Documento en odd/tasks/06-stats.md. El único freno es el del paso 4.
- Un commit por tarea sobre main. Podés pushear con las condiciones de siempre.
- RDD en cada commit, como pide el protocolo. Cuando corresponda una revisión, corréla. Con lo que encuentre: lo bloqueante, mostrámelo en una línea y arreglalo en su propio commit; lo demás, anotalo como pendiente en DECISIONS.md con el arreglo propuesto y seguí sin frenar. No lances el verificador independiente.

Al cerrar
- Una lista corta para probarlo en el celular contra producción.
- La sesión registrada en prompts/sessions/06-stats.md.
````

- **L2** (2026-11-20). Exploration, no code. Read 01 §8, 02 §6, §7 and §9, and 03 §5.4, §9 and §10. The unit 5 question about the text for a buy at exactly zero got no answer in this brief, so that item stays pending in `DECISIONS.md`. 02 §6 gives `computeStats(rounds)` without the coin, while the verdict needs the coin's range, so the signature changes (A1). 02 §7 does not say what `avgAll` and `hitRate` are with no rounds (A3). Production `/status` still shows one `ready` stock.

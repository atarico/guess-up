# Session 07 — Work unit 7: the demo account

- **Date:** 2026-11-20, 14:29 to about 14:55 UTC, in the same Claude Code session as the fixes after unit 6 (`06-stats.md`, part 2).
- **Tool:** Claude Code 2.1.329, with the Gentle AI ODD rules, RDD and Engram memory. No sub-agents and no independent verifier (the brief ruled it out). The browser checks ran with a cached `playwright-core` from a scratch script, against `next dev` with the whole API mocked in the browser: nothing reached the production backend or database. The only production access was `pnpm seed:check`, read-only.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`).
- **Plan and logbook:** `odd/tasks/07-demo.md`: specs S1–S10 quoting the author, assumptions A1–A6, tasks T1–T6, the author steps, the phone checklist and the log.
- **Time against the budget:** 01 §15 gives unit 7 15 minutes; the session took about 20, including the review.
- **Secrets:** none in this file. No demo credentials were chosen or seen by the AI: the author sets them (S6).

## Prompts

The author's prompts are copied exactly as sent, extracted from the Claude Code transcript rather than retyped. The short outcome after each prompt is not part of it.

### Prompt 1 — 14:29 UTC (pasted text)

````text
Unidad 7 de la sección 15 de 01-product.md: la cuenta demo. El script seed:demo está en 02-backend.md §5.5; el link, en 03-frontend.md §5.1 y §5.2; el aviso, en §5.4.

Qué tiene que quedar funcionando
- pnpm seed:demo según 02 §5.5: crea el usuario demo y deja 40 rondas decididas por una moneda con semilla, usando el mismo servicio de rondas que el juego. Idempotente, con --reset.
- El link "Probar la cuenta demo" en la bienvenida y en el login: carga las credenciales y entra de un toque.
- El aviso de cuenta demo en Estadísticas, solo cuando user.isDemo es verdadero.

Tests (sin red ni base)
- El script deja exactamente 40 rondas decididas y ninguna abierta. Corrido dos veces, siguen siendo 40. Con --reset, borra y vuelve a dejar 40.
- Sin símbolos ready, termina con un mensaje claro y no crea nada.
- Sin DEMO_EMAIL o sin DEMO_PASSWORD, no arranca.
- El link no se renderiza si falta cualquiera de las dos variables del front: ninguna cargada, o una sola.

Lo que hago yo, con tus instrucciones
Pasame los pasos numerados y en orden:
- Qué variables cargo en backend/.env y con qué restricciones (que el correo y la contraseña pasen la validación de /auth).
- El comando de seed:demo contra producción y qué tengo que ver en su salida.
- Qué variables cargo en Vercel, y si hace falta volver a desplegar para que el link aparezca.
- Cómo compruebo después qué veredicto muestra la cuenta. Si la moneda cae fuera de su propio rango, lo vuelvo a correr con --reset.
Las credenciales demo son públicas por diseño, pero igual las cargo yo.

Antes de que yo corra nada
Confirmá con la verificación post-seed que la base tiene el universo completo. Con un solo símbolo, las 40 rondas de la demo serían todas de la misma acción.

Para darlo por terminado
- Entro con la cuenta demo y veo el veredicto sin jugar ninguna ronda, con el aviso arriba.
- Con mi cuenta normal, el aviso no aparece.
- El link no aparece si las variables no están cargadas.
- typecheck, lint, test y build en verde, y la búsqueda de control de 03 §11 vacía.

ODD y revisión
- Documento en odd/tasks/07-demo.md. Arrancá sin esperarme; frená solo si algo contradice la spec.
- Un commit por tarea sobre main. Mostrame los commits y el push lo hago yo.
- RDD en cada commit, como pide el protocolo. Cuando corresponda una revisión, corréla. Con lo que encuentre: lo bloqueante, mostrámelo en una línea y arreglalo en su propio commit; lo demás, anotalo como pendiente en DECISIONS.md con el arreglo propuesto y seguí sin frenar. No lances el verificador independiente.

Al cerrar
- Una lista corta para probarlo en el celular contra producción.
- La sesión registrada en prompts/sessions/07-demo.md.
````

**Outcome:**
- **Universe check first (S7):** `pnpm seed:check` found 1 `ready` (AAPL, 4,999 bars, 2007-01-08 to 2026-11-18), 59 `pending`, none `failed`, no move above 40%. The universe is not complete; the author's `pnpm seed` has to finish before `seed:demo` runs in production. Reported at once; not a contradiction of the specs, so the work went on.
- **T2 `pnpm seed:demo`:** RED 10 of 10 against a stub, then GREEN. `runDemoSeed` uses `roundService` and a coin with a fixed seed (20 buys, 20 passes); the `/auth` schema and the bcrypt hash moved to `authService` so the script shares them.
- **RDD:** the open slice was `high` (auth path), so a review was due; the AI relayed the consent prompt.
- **T3, T4:** the demo link (`lib/demo.ts`, RED 3 of 4, then GREEN) and the banner from `GET /auth/me`, checked in the browser with three builds.

### Prompt 2 — about 14:38 UTC (answer to the review consent prompt)

The AI relayed Gentle AI's consent envelope with the native question tool, translated, with both choices and their effects. The author selected:

````text
Revisar este cambio
````

**Outcome:** the review ran with the risk, resilience and reliability lenses on `a09aa59..af8908f`: 0 findings in each, approved and acknowledged. Nothing to fix and nothing to add to `DECISIONS.md` as pending.

### Prompt 3 — 14:49 UTC

````text
Antes del push arregla lo del NaN: si a /stats le falta un campo o no es un numero, la frase de la moneda no se muestra. Nunca NaN en pantalla, con un test.
````

**Outcome:** the AI had warned that Vercel usually deploys before Render, and that for those minutes the new frontend would read "la moneda te gana el NaN%" from the old `/stats`, which has no `beatenBy`. Two tests first (a field missing, a field that is not a number); RED showed exactly `la moneda te gana el NaN%`. `coinParts` now returns null unless every number of the coin section is finite, and the section is left out. Checked in the browser with an old-style `/stats`: verdict and figures, no coin section, no `NaN`. Logged as L5 and T7 in the task document.

## Done-when list of the brief, with the evidence

| Criterion | Evidence |
| --- | --- |
| 40 decided rounds and none open; twice still 40; `--reset` deletes and leaves 40 | `backend/test/demoSeed.test.ts`, in-memory repositories: 40 decided and 0 open; a second run adds 0; `--reset` removes 43 (an open one too) and leaves 40 new rounds |
| No ready stock: a clear message, nothing created | Same file: `No stock is ready yet: run pnpm seed first. Nothing was created.`, no user and no round stored |
| No `DEMO_EMAIL` or no `DEMO_PASSWORD`: it does not start | `demoConfig` tests for each and both; the script run with an empty environment exits 1 with `Missing environment variables: DEMO_EMAIL, DEMO_PASSWORD.` before any connection |
| The link is not rendered without both front variables | `frontend/src/lib/demo.test.ts` (neither, one, empty, both) and three browser builds: the link shows only with both |
| The demo account sees the verdict without playing, with the banner on top | Browser, API mocked: one tap from welcome or log-in lands on `/play`; Stats starts with the banner, then the verdict. In production: the author's phone checklist |
| An ordinary account sees no banner | Browser, API mocked: no banner for an ordinary token |
| typecheck, lint, test, build; 03 §11 search empty | Backend 173 tests, frontend 46; all green in both packages; no bare `$` with a digit, no voseo, no literal text in components |

## RDD

- `cc47300` (task document) passive. `af8908f` (`seed:demo`) `high` (`hot_path`, `backend/src/routes/auth.ts`); the open slice since `a09aa59`, the three fixes after unit 6 included, was reviewed (Prompt 2). `b156990` and `d3ea2cc` `medium`, under budget.

## What the AI got wrong / what was fixed by hand

- **The review preflight was sent with its lenses before the untracked files were declared,** and was refused (`invalid_request`). The AI then guessed the JSON of the untracked selection and was refused again. `review status` accepts `--untracked-scope=exclude`, the same flag as `assess`; with it, the review started.
- **The first log-in form change failed lint and typecheck:** it set state synchronously inside an effect, and used an imported constant inside a callback, which TypeScript does not narrow. The demo arrival now starts in its sending state and the effect only sends the request; the callback uses a local constant.
- **The AI wrote times it had not checked** in the task document's log, twice (14:52 for L3, about 14:55 for L5); both were corrected from the clock and the transcript before their commits.
- **The `NaN` window was only reported, not fixed,** until the author asked (Prompt 3). The fix is a guard in `coinParts`.
- **The AI cannot read `.env` files,** `.env.example` included (a permission rule; it did not try other ways). Whether both examples list the demo variables is in the author's step 2.
- **Nothing was fixed by hand by the author.** Steps 1 to 5 and the phone checklist are theirs and had not run when this log was written.

## Resulting commits

On `main`, not pushed (the author pushes), after the fixes of `06-stats.md` part 2:

- `cc47300` docs(odd): open unit 7 with the universe check
- `af8908f` feat(backend): add pnpm seed:demo
- `b156990` feat(frontend): add the demo link to the welcome and log-in screens
- `d3ea2cc` feat(frontend): show the demo banner on Stats
- `c872a5a` docs: close unit 7 with the author steps and the session log
- `2dc2a23` fix(frontend): hide the coin section when /stats lacks a number

This update of the log is one more commit, made afterwards.

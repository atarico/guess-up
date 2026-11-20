# 07-demo — Work unit 7: the demo account

Objective: work unit 7 of `prompts/specs/01-product.md` §15: `pnpm seed:demo` (02 §5.5), the demo link on the welcome and log-in screens (03 §5.1, §5.2) and the demo banner on Stats (03 §5.4). Branch: `main`, one commit per task, the author pushes. Delivery: `ask-on-risk`. Tests: Vitest (+ supertest) in each package, no network and no database.

## Specs

Quoted from the author's request (L1), verbatim.

- **S1 Scope.** "Unidad 7 de la sección 15 de 01-product.md: la cuenta demo. El script seed:demo está en 02-backend.md §5.5; el link, en 03-frontend.md §5.1 y §5.2; el aviso, en §5.4."
- **S2 Seed script.** "pnpm seed:demo según 02 §5.5: crea el usuario demo y deja 40 rondas decididas por una moneda con semilla, usando el mismo servicio de rondas que el juego. Idempotente, con --reset."
- **S3 Demo link.** "El link "Probar la cuenta demo" en la bienvenida y en el login: carga las credenciales y entra de un toque."
- **S4 Demo banner.** "El aviso de cuenta demo en Estadísticas, solo cuando user.isDemo es verdadero."
- **S5 Tests, no network and no database.** "El script deja exactamente 40 rondas decididas y ninguna abierta. Corrido dos veces, siguen siendo 40. Con --reset, borra y vuelve a dejar 40." / "Sin símbolos ready, termina con un mensaje claro y no crea nada." / "Sin DEMO_EMAIL o sin DEMO_PASSWORD, no arranca." / "El link no se renderiza si falta cualquiera de las dos variables del front: ninguna cargada, o una sola."
- **S6 Author steps, numbered and in order.** "Qué variables cargo en backend/.env y con qué restricciones (que el correo y la contraseña pasen la validación de /auth)." / "El comando de seed:demo contra producción y qué tengo que ver en su salida." / "Qué variables cargo en Vercel, y si hace falta volver a desplegar para que el link aparezca." / "Cómo compruebo después qué veredicto muestra la cuenta. Si la moneda cae fuera de su propio rango, lo vuelvo a correr con --reset." / "Las credenciales demo son públicas por diseño, pero igual las cargo yo."
- **S7 Universe check first.** "Confirmá con la verificación post-seed que la base tiene el universo completo. Con un solo símbolo, las 40 rondas de la demo serían todas de la misma acción."
- **S8 Done when.** "Entro con la cuenta demo y veo el veredicto sin jugar ninguna ronda, con el aviso arriba." / "Con mi cuenta normal, el aviso no aparece." / "El link no aparece si las variables no están cargadas." / "typecheck, lint, test y build en verde, y la búsqueda de control de 03 §11 vacía."
- **S9 ODD and review.** "Arrancá sin esperarme; frená solo si algo contradice la spec." / "Un commit por tarea sobre main. Mostrame los commits y el push lo hago yo." / "RDD en cada commit, como pide el protocolo. Cuando corresponda una revisión, corréla. Con lo que encuentre: lo bloqueante, mostrámelo en una línea y arreglalo en su propio commit; lo demás, anotalo como pendiente en DECISIONS.md con el arreglo propuesto y seguí sin frenar. No lances el verificador independiente."
- **S10 Close.** "Una lista corta para probarlo en el celular contra producción." / "La sesión registrada en prompts/sessions/07-demo.md."

## Assumptions

Where the specs leave a choice open; each one is also in `DECISIONS.md`.

- **A1 Where Stats learns `isDemo`.** The client keeps only the token (03 §7), so the stats screen asks `GET /auth/me` together with `GET /stats` and waits for both. If `/auth/me` fails, there is no banner and the scoreboard still shows.
- **A2 The welcome link.** It goes to `/login?demo=1`; the form fills the demo credentials and submits them, the same action as the link on the log-in screen.
- **A3 An ordinary account is never touched.** If `DEMO_EMAIL` belongs to an account that is not a demo account, the script stops before writing anything, so `--reset` can never delete a real user's rounds.
- **A4 The coin and the charts.** The decisions come from a coin with a fixed seed; the charts are picked with `Math.random`, as in play, so `--reset` gives new charts and possibly a new verdict.
- **A5 The script checks the credentials with the `/auth` rules** (trimmed, lower-case, valid email; 8 characters to 72 bytes of password), so what it stores can be used to log in, and it prints the verdict Stats will show.
- **A6 An existing demo user keeps its password.** 02 §5.5 says "creates the user if missing"; the script does not rewrite the password of a demo user that already exists.

## Tasks

| ID | Task | Specs | Route | Status | Commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T1 | Universe check with `pnpm seed:check` (read-only) | S7 | inline | done | L2: 1 `ready` (AAPL), 59 `pending`, 0 `failed`, 0 moves above 40%. Not the full universe |
| T2 | `pnpm seed:demo`: `runDemoSeed` and its config, test-first; script wiring; 02 §5.5 | S2, S5, S6 | inline | done | `feat(backend): add pnpm seed:demo`; RED 10 of 10 failed against a stub / GREEN 10 passed in `test/demoSeed.test.ts`: 40 decided and none open on a new demo user; twice still 40 (added 0); `--reset` deletes 43 rounds (an open one too) and leaves 40 new ones; two fresh runs make the same decisions, with buys and passes; no ready stock: the message and no user, no round; an ordinary account with the same email is refused and untouched; `demoConfig`: missing `DEMO_EMAIL`, `DEMO_PASSWORD` or both, credentials `/auth` rejects, email normalised, `--reset`, any other argument refused. The script run with an empty environment: missing variables, usage, a short password and a missing `DATABASE_URL` each exit 1 before any connection. Backend 173 tests, typecheck, lint, build green |
| T3 | Demo link on welcome and log-in; `lib/demo.ts` tested for none, one and both variables | S3, S5, S8 | inline | done | `feat(frontend): add the demo link to the welcome and log-in screens`; RED 3 of 4 against a stub / GREEN 4 in `lib/demo.test.ts` (neither, only one, empty counts as missing, both). Browser at 390 px with the API mocked (`playwright-core` from the npx cache, scratch script), three `next dev` builds: both variables, the link on welcome and log-in, one tap from each lands on `/play` after `POST /auth/login` with the demo email; none, and only the email: no link on either screen. No horizontal scroll. Next.js docs: `NEXT_PUBLIC_` values are inlined at `next build`, so Vercel needs a redeploy |
| T4 | Demo banner on Stats from `GET /auth/me` | S4, S8 | inline | done | `feat(frontend): show the demo banner on Stats`; no pure logic to test (the banner shows when `user.isDemo` is true). Browser at 390 px with the API mocked: the demo account's Stats starts with `Cuenta demo. Sus primeras 40 gráficas las jugó una moneda.` above the verdict, which shows without playing; an ordinary token gets no banner; `/stats` asked `GET /stats` and `GET /auth/me` only. The banner wraps to two lines at 390 px: the approved text is longer than one line there |
| T5 | RDD per commit; review if due; blocking findings fixed in their own commit, the rest pending in `DECISIONS.md` | S9 | inline | pending | |
| T6 | All checks, 03 §11 search, author steps, phone checklist, session log `prompts/sessions/07-demo.md` | S6, S8, S10 | inline | pending | |

Route: inline for every task. No writer trigger: each unit is small and the author must explain it; no independent verifier (S9).

## Author steps

Filled at close.

## Log

- **L1** (2026-11-20 14:29 UTC, author's request, verbatim):

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

- **L2** (14:31 UTC) `pnpm seed:check` against the production database, read-only: `pending` 59, `ready` 1 (AAPL, 4,999 bars, 2007-01-08 to 2026-11-18), no `failed`; day-to-day moves above 40%: 0. The universe is not complete: the author's full `pnpm seed` has to finish before `seed:demo` runs in production. Not a contradiction of the specs, so the work goes on; reported to the author.

- **L3** (14:52 UTC) RDD after `af8908f`: the open slice `a09aa59..af8908f` (the fixes after unit 6, the task document, `seed:demo`) assessed `high` (`hot_path`: `backend/src/routes/auth.ts`), review due. Consent relayed to the author, who chose "Revisar este cambio" (`granted`). Lenses risk, resilience and reliability, lineage `review-d7aa3e23d2fba210`: 0 findings in each lens, approved and acknowledged (`gentle-ai.review-acknowledged/v1`). Nothing blocking, nothing pending. The reviewed boundary is now `af8908f`.

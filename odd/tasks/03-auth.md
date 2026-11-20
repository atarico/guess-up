# 03-auth — Work unit 3: auth

Objective: work unit 3 of `prompts/specs/01-product.md` §15: register, login and the JWT middleware (`02-backend.md` §4), plus the welcome and login screens and the client session (`03-frontend.md` §4, §5.1, §5.2, §7). Branch: `main`, direct; one Conventional Commit per task; RDD assessment after each commit; the AI may push when a task needs a deploy (tests green, no force, no `.env`). Test runner: Vitest (backend with supertest). pnpm 10, Node 24.

## Specs

Quoted from the author's request (L1), verbatim.

- **S1 Scope.** "Unidad 3 de la sección 15 de 01-product.md: registro, login y el middleware del JWT. Backend en 02-backend.md §4; frontend en 03-frontend.md §5.1, §5.2 y §7." / Out: "Rondas, estadísticas, la pantalla de servidor despertando y la cuenta demo."
- **S2 Backend.** "Backend: POST /auth/register, POST /auth/login, GET /auth/me y requireAuth, según 02 §4. Al verificar el token, el algoritmo queda fijado en HS256."
- **S3 Screens.** "Frontend: la bienvenida (5.1) y el formulario de registro y login (5.2), definitivos, con la dirección visual de 03 §4 y todo el texto desde copy.ts. La página provisoria de la unidad 1 se va."
- **S4 Client session.** "Sesión en el cliente según 03 §7. Como /play todavía no existe, dejá en esa ruta una página protegida provisoria que llame a /auth/me, muestre el correo y tenga "Cerrar sesión". Se reemplaza en la unidad 5."
- **S5 Demo link.** "El link de la cuenta demo no se muestra: sus variables no están cargadas hasta la unidad 7."
- **S6 Rate-limit corrections, approved.** "Dos correcciones a la spec que apruebo desde ya (spec y DECISIONS.md en el mismo commit)" / "El límite de 20 pedidos cada 15 minutos aplica solo a register y login. GET /auth/me queda afuera: se llama en cada carga de página y agotaría el límite de un usuario normal." / "Cuando se supera el límite, la respuesta usa nuestro formato de error con un código nuevo, RATE_LIMITED (429), y el front muestra: "Demasiados intentos. Espera unos minutos e intenta de nuevo." Activá los headers estándar de rate limit, que sirven para la prueba de abajo."
- **S7 TRUST_PROXY_HOPS.** "Se mide en esta unidad, como dice 02 §4. Pasame los pasos; el número lo pruebo yo en Render." / "Que el endpoint temporal /ip devuelva req.ip, el X-Forwarded-For crudo y cuántas direcciones trae, así el número sale de una sola visita." / "/ip se borra antes de cerrar, y el número medido y la fecha van a DECISIONS.md."
- **S8 Process.** "Documento en odd/tasks/03-auth.md, frená con el resumen antes de escribir código, un commit por tarea sobre main y RDD en cada commit. Podés pushear cuando una tarea necesite deploy, con las condiciones de siempre: tests en verde, sin force y sin ningún .env en los commits."
- **S9 Tests (no network, no database).** "Registro, login y ruta protegida; correo duplicado da 409; correo o contraseña incorrectos dan 401 con el mismo mensaje en los dos casos." / "Sin token, con token mal firmado y con token vencido: 401." / "Ninguna respuesta de /auth incluye password_hash."
- **S10 Production checklist for the author,** "con resultado esperado y qué significa si falla": "Me registro, entro, recargo y sigo adentro. Cierro sesión y vuelvo a la bienvenida." / "Con el token borrado o alterado, la ruta protegida me manda al login con el aviso de sesión vencida." / "Los errores del formulario salen en español y el botón no se puede apretar dos veces." / "El límite cuenta por visitante: desde dos redes distintas, el contador de cada una baja por separado." / "/ip responde 404." / "Todo lo anterior en 390 px de ancho y en Brave con Shields encendido."
- **S11 Close.** "Lanzá el verificador independiente sobre la unidad, con contexto limpio y solo lectura. Mostrame el informe antes de arreglar nada." / "La sesión registrada en prompts/sessions/03-auth.md."

Assumptions, pending the author's ok:

- **A1. Layers as 02 §2.** `repositories/users.ts` (SQL only), `services/authService.ts` (bcryptjs cost 10; signs HS256 with `sub` = user id and a 7-day expiry), `routes/auth.ts`, `middleware/requireAuth.ts` (`jwt.verify` with `algorithms: ['HS256']`, sets `req.userId`), `middleware/validate.ts` (zod; first issue → `400 VALIDATION`). `createApp` deps gain `users`, `jwtSecret` and `trustProxyHops`; route tests pass an in-memory users repository.
- **A2. The database decides a duplicate email:** `insert … on conflict (email) do nothing returning …`; no row back → `409 EMAIL_TAKEN`. No check-then-insert race.
- **A3. Errors that carry their own code** (`INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `UNAUTHORIZED`, `VALIDATION` from zod) are one `ApiError(status, code, message)` class in `middleware/errors.ts`. The handler answers with its code and message, logs only status and code, and keeps mapping every other error by status as today.
- **A4. Password limit counted in UTF-8 bytes: 8 to 72.** bcrypt ignores everything after byte 72, and a 72-character password with `ñ` or accents is longer than 72 bytes, so its tail would not count. For ASCII passwords nothing changes. 02 §4 says "characters": changed in the same commit, with a `DECISIONS.md` line.
- **A5. No dummy bcrypt run for an unknown email at login.** The timing difference tells whether an email exists, but `409 EMAIL_TAKEN` on register already tells that by design. Recorded in `DECISIONS.md`, not built.
- **A6.** `GET /auth/me` with a valid token whose user no longer exists → `401 UNAUTHORIZED`.
- **A7. One limiter shared by both routes:** register and login draw from one bucket of 20 per visitor per 15 minutes (IPv6 grouped by /56, the library default); in-memory store, lost on sleep (02 §11 already leaves out multi-instance limiting). Mounted after `cors`, so a browser can read the 429; preflight `OPTIONS` is answered by `cors` first and does not count. Headers `draft-8`: `RateLimit-Policy`, `RateLimit: …; r=<remaining>; t=<seconds>`, and `Retry-After` on a 429; the legacy `X-RateLimit-*` off.
- **A8. `TRUST_PROXY_HOPS`** parsed in `env.ts`: optional, integer ≥ 0, default 0. `app.set('trust proxy', n)` right after creating the app, only when n > 0. Tested: with 1 hop, two different `X-Forwarded-For` clients get separate buckets.
- **A9. `GET /ip`** answers `{ ip, forwardedFor, forwardedCount }` (`req.ip`, the raw header or `null`, the number of comma-separated addresses); no auth, no limit; removed in T6.
- **A10. Frontend as 03 §2.** `lib/api.ts`: one request function (base URL, bearer token from storage, parses `error.code`); the code `UNAUTHORIZED` clears the token and goes to `/login?expired=1`. It keys on the code, not on 401, so `INVALID_CREDENTIALS` stays on the form. `lib/api-types.ts`: `User`, the auth response, the error codes. `lib/auth.tsx`: `AuthProvider` reads the token once on mount; `signIn`, `signOut`. Pages: `/` welcome (signed-in visitors go to `/play`), `/login` (server page for the title, client form), `/play` provisional. `Empezar` opens `/login?mode=signup`; `Iniciar sesión` opens `/login`.
- **A11. The form uses `noValidate`.** The browser's own validation bubbles come in the browser's language, which would break "errores en español". The server validates; the form maps `VALIDATION`, `EMAIL_TAKEN`, `INVALID_CREDENTIALS` and `RATE_LIMITED` to 03's copy, and anything else, network failures included, to `Algo salió mal. Intenta de nuevo.` The submit button is disabled while a request is in flight.
- **A12. Visual direction:** the six tokens of 03 §4 in Tailwind 4's `@theme`; Geist and Geist Mono, already loaded with `next/font`; the dark-mode block removed; visible focus ring in `ink`; touch targets ≥ 48 px. Reveal motion and the double-tap viewport stay with unit 5.
- **A13. Provisional `/play` copy** lives in `copy.ts`, marked provisional like unit 1's block: a line with the email and the `Cerrar sesión` button; page title `Guess-Up · Jugar` (03 §10). Loading shows a neutral skeleton; a failed `/auth/me` other than `UNAUTHORIZED` shows `Algo salió mal. Intenta de nuevo.` with `Reintentar` (03 §8).
- **A14. Scope recorded in the spec:** 01 §15 row 3 gains "welcome and login screens, client session"; row 5 keeps play and reveal. One `DECISIONS.md` line.
- **A15. Manual pass before the deploy:** Playwright at 390 px and desktop width, local frontend against a local backend booted with in-memory repositories from a scratch script outside the repo, so no test users land in the production database. The production pass is the author's (S10).
- **A16. Time:** 01 §15 budgets 25 minutes for the backend part; the screens and the client session are extra. The log records the real time.

Open question for the author (Q1): with the token deleted there is nothing for the server to reject, and the app cannot tell "my session was lost" from "I never logged in". See L2.

## Tasks

| ID | Task | Specs | Route | Status | Commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T1 | Register, login, `/auth/me`, `requireAuth` (HS256 pinned), `validate`, `ApiError`, users repository; tests of S9; `DECISIONS.md`: no refresh token, no email verification or reset, A4, A5 | S2, S9 | inline | done | `feat(backend): add register, login and the JWT middleware`; 16 tests in `test/auth.test.ts` (flow, 7-day HS256 token, 409 in any case, 400 cases incl. 74 bytes, same 401 body for both wrong inputs, 401 without token / other secret / not a JWT / expired / HS384 / deleted user, no hash in any of 6 responses); the HS384 test fails with the pin removed (observed) and passes with it; 86 tests, typecheck, lint, build green; 02 §4 password limit in bytes |
| T2 | Rate limit on register and login (A7), `RATE_LIMITED` 429, standard headers; `TRUST_PROXY_HOPS` (A8); 02 §4, §7 and 03 §5.2 updated with `DECISIONS.md` in the same commit | S6, S7 | inline | pending | |
| T3 | Temporary `GET /ip` (A9); push and Render deploy; the author measures (Author steps) | S7, S8 | inline | pending | |
| T4 | Visual direction (03 §4), welcome screen (5.1), provisional page of unit 1 removed; 01 §15 row 3 (A14) | S3, S5 | inline | pending | |
| T5 | Log in / sign up form (5.2), `api.ts`, `api-types.ts`, `auth.tsx`, provisional protected `/play`; `DECISIONS.md`: `localStorage` trade-off (03 §7); manual pass (A15); push and Vercel deploy | S3, S4, S5, S6 | inline | pending | |
| T6 | Measured `TRUST_PROXY_HOPS`: `/ip` removed, number and date in `DECISIONS.md`; push | S7 | inline | pending | |
| T7 | Production checklist for the author, with expected result and meaning of a failure (Author steps) | S10 | inline | pending | |
| T8 | Independent verifier over the unit, clean context, read-only; report shown before any fix | S11 | delegated (verifier) | pending | |
| T9 | Session log `prompts/sessions/03-auth.md` | S11 | inline | pending | |

Route evidence: no writer is delegated. The backend tasks build on each other, and the screens need the backend for their manual pass, so no two units are independent. T8 is delegated because the author asked for it.

## Author steps

### Measure `TRUST_PROXY_HOPS` (after T3 is live on Render)

Why the number matters: Render's proxies append addresses to `X-Forwarded-For`. With `trust proxy` set to `n`, Express counts `n` addresses from the right of that list (the socket address first) and calls the next one the client. When `n` equals the number of addresses Render added, `req.ip` is the leftmost one, the visitor. Too low and every visitor shares a proxy's bucket; too high and a client can send its own `X-Forwarded-For` and pick its address.

1. With `TRUST_PROXY_HOPS` unset (0), open `https://guess-up-api.onrender.com/ip` once, from a plain browser tab or `curl -s https://guess-up-api.onrender.com/ip`. Do not add any header.
2. Check that the leftmost address in `forwardedFor` is your public IP (it can be IPv6 if your connection is). If it is, the candidate is `forwardedCount`. If it is not, stop and send me the response.
3. On Render, set `TRUST_PROXY_HOPS` to that number and let the service redeploy.
4. Open `/ip` again: `ip` must now equal your public IP.
5. Forgery check: `curl -s -H 'X-Forwarded-For: 203.0.113.7' https://guess-up-api.onrender.com/ip`. `ip` must still be your IP. If it shows `203.0.113.7`, the number is too high.
6. Second network (the phone on mobile data, Wi-Fi off): `ip` is that network's address, different from step 4.
7. Render logs after the redeploy: neither `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` nor `ERR_ERL_PERMISSIVE_TRUST_PROXY`. Before step 3, one `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` on the first `/auth` request is expected: it is the warning that the setting is missing.
8. Send me the number and the date; T6 removes `/ip` and records both.

### Production checklist (T7)

Written at T7.

## Log

- **L1** (2026-11-20, author's request, verbatim):

````text
Unidad 3 de la sección 15 de 01-product.md: registro, login y el middleware del JWT. Backend en 02-backend.md §4; frontend en 03-frontend.md §5.1, §5.2 y §7.

Qué tiene que quedar funcionando
- Backend: POST /auth/register, POST /auth/login, GET /auth/me y requireAuth, según 02 §4. Al verificar el token, el algoritmo queda fijado en HS256.
- Frontend: la bienvenida (5.1) y el formulario de registro y login (5.2), definitivos, con la dirección visual de 03 §4 y todo el texto desde copy.ts. La página provisoria de la unidad 1 se va.
- Sesión en el cliente según 03 §7. Como /play todavía no existe, dejá en esa ruta una página protegida provisoria que llame a /auth/me, muestre el correo y tenga "Cerrar sesión". Se reemplaza en la unidad 5.
- El link de la cuenta demo no se muestra: sus variables no están cargadas hasta la unidad 7.

Dos correcciones a la spec que apruebo desde ya (spec y DECISIONS.md en el mismo commit)
- El límite de 20 pedidos cada 15 minutos aplica solo a register y login. GET /auth/me queda afuera: se llama en cada carga de página y agotaría el límite de un usuario normal.
- Cuando se supera el límite, la respuesta usa nuestro formato de error con un código nuevo, RATE_LIMITED (429), y el front muestra: "Demasiados intentos. Espera unos minutos e intenta de nuevo." Activá los headers estándar de rate limit, que sirven para la prueba de abajo.

TRUST_PROXY_HOPS
- Se mide en esta unidad, como dice 02 §4. Pasame los pasos; el número lo pruebo yo en Render.
- Que el endpoint temporal /ip devuelva req.ip, el X-Forwarded-For crudo y cuántas direcciones trae, así el número sale de una sola visita.
- /ip se borra antes de cerrar, y el número medido y la fecha van a DECISIONS.md.

Qué no entra
Rondas, estadísticas, la pantalla de servidor despertando y la cuenta demo.

ODD, como en las unidades anteriores
Documento en odd/tasks/03-auth.md, frená con el resumen antes de escribir código, un commit por tarea sobre main y RDD en cada commit. Podés pushear cuando una tarea necesite deploy, con las condiciones de siempre: tests en verde, sin force y sin ningún .env en los commits.

Para darlo por terminado
Tests (sin red ni base):
- Registro, login y ruta protegida; correo duplicado da 409; correo o contraseña incorrectos dan 401 con el mismo mensaje en los dos casos.
- Sin token, con token mal firmado y con token vencido: 401.
- Ninguna respuesta de /auth incluye password_hash.
Lista para que yo pruebe contra producción, con resultado esperado y qué significa si falla:
- Me registro, entro, recargo y sigo adentro. Cierro sesión y vuelvo a la bienvenida.
- Con el token borrado o alterado, la ruta protegida me manda al login con el aviso de sesión vencida.
- Los errores del formulario salen en español y el botón no se puede apretar dos veces.
- El límite cuenta por visitante: desde dos redes distintas, el contador de cada una baja por separado.
- /ip responde 404.
- Todo lo anterior en 390 px de ancho y en Brave con Shields encendido.

Al cerrar
- Lanzá el verificador independiente sobre la unidad, con contexto limpio y solo lectura. Mostrame el informe antes de arreglar nada.
- La sesión registrada en prompts/sessions/03-auth.md.
````

- **L2** (2026-11-20). Exploration, no code. Read 01 §15, 02 §2, §4, §7–§9, 03 §2–§5.2, §7, §8, §10–§12, `app.ts`, `env.ts`, `index.ts`, `middleware/errors.ts`, the test fakes and the frontend sources. Facts that shape the plan: `env.ts` does not parse `TRUST_PROXY_HOPS` yet; the error handler maps 401 to `UNAUTHORIZED` by status, so `INVALID_CREDENTIALS` and `EMAIL_TAKEN` need an error that carries its own code (A3); express-rate-limit's docs list `draft-6`, `draft-7` and `draft-8` for `standardHeaders`, and `draft-8` is the one its README uses (A7); `globals.css` still holds the create-next-app colours and a dark-mode block (A12). **Q1, for the author:** 03 §8 ties the "Tu sesión expiró" notice to an expired session. A tampered token gets a 401 from `/auth/me`, so the notice is accurate there. A deleted token never reaches the server: the protected page only sees "no token", which is also what a visitor who never logged in sees, for example someone opening a shared `/play` link. Showing the notice in that case tells that visitor something false; not showing it changes the expected result of the second checklist line for the deleted-token case.
- **L3** (2026-11-20, the author, verbatim): "Si a tu recomendacion de Q1: el aviso solo cuando el servidor rechaza el token, sin token va al login sin aviso. Ok a los supuestos. Segui con el plan." Q1 resolved: the "Tu sesión expiró" notice appears only when the server answers `UNAUTHORIZED`; a protected page with no token goes to `/login` without it. A1–A16 approved.

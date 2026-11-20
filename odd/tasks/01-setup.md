# 01-setup — Work unit 1: scaffold, schema, /health, deploy both skeletons

Objective: work unit 1 of `prompts/specs/01-product.md` §15. Branch: `main`, direct, no feature branch or PR (S7). Delivery: one Conventional Commit per task, the AI commits after checking that no `.env` is staged, the author pushes. Test runner: Vitest (backend with supertest). Package manager: pnpm 10 (S11); Node 24 (S12).

## Specs

Quoted from the author's request (L1), verbatim.

- **S1 Structure and commands.** "La estructura de backend/ y frontend/ según 02 §2 y 03 §2, con los comandos de CLAUDE.md andando (typecheck, lint, build, test)."
- **S2 Schema.** "El schema de 02 §3 aplicado en Supabase." / "La migración contra Supabase la corrés vos, recién cuando te confirme que DATABASE_URL está en backend/.env, y sin mostrar la URL."
- **S3 Health.** "GET /health según 02 §7, con app.ts exportando createApp(deps) y un test de ruta que no toque red ni base."
- **S4 Deploy.** "Los dos esqueletos desplegados y conectados entre sí: el frontend desplegado muestra una página mínima que llama a /health del backend desplegado y enseña la respuesta. Esa página es provisoria y se reemplaza en la unidad 5; sirve para comprobar NEXT_PUBLIC_API_URL y CORS de punta a punta."
- **S5 Out of scope.** "Autenticación, rondas, cliente de Twelve Data, seed, universe.ts, pantallas reales y diseño. Si algo de eso parece necesario para terminar, frená y decímelo."
- **S6 Author setup instructions.** "Dame los pasos y los valores exactos de cada uno: directorio raíz, comandos de build y de arranque, ruta del health check, región, versión de Node y la lista completa de variables de entorno con qué va en cada una. Verificá los pasos contra la documentación actual de cada servicio, no de memoria." / "Los secretos los cargo yo en cada panel. No me pidas valores ni los imprimas. Para JWT_SECRET pasame el comando para generarlo y lo corro yo." / "CORS_ORIGIN arranca con localhost y se le agrega la URL de Vercel después del primer deploy: decime en qué momento." / "TRUST_PROXY_HOPS no se toca hasta la unidad 3."
- **S7 Process.** "TDD no aplica acá: no hay código de dominio. Alcanzan los chequeos funcionales." / "se trabaja directo sobre main, sin rama de feature ni PR. Un commit por tarea, con Conventional Commits. Si la unidad pasa de 400 líneas propias, seguí igual: no la partas ni me preguntes por eso." / "Antes de cada commit comprobá que no haya ningún .env en el stage. El push lo hago yo."
- **S8 Deploy evidence.** "Las tareas de deploy dependen de mí. Dejalas pendientes en el documento y marcalas recién cuando te pase el resultado de la lista de pruebas. No las des por hechas sin esa evidencia."
- **S9 Close.** "Una lista para probar contra las dos URLs: comando o paso, resultado esperado y qué significa si falla. Que cubra /health, CORS desde el origen de Vercel y desde otro origen, una ruta inexistente y el arranque en frío." / "La sección Commands de CLAUDE.md completada, con la copia de prompts/system sincronizada." / "La sesión registrada en prompts/sessions/01-setup.md."
- **S10 Budget.** "Presupuesto: 30 minutos. Si algo se va de eso, avisame en vez de seguir." / Updated in L4: "Ok al plan, no cortes alcance. El tiempo de mas lo explico en el README."
- **S11 Package manager** (L4). "vamos a usar pnpm como gestor no npm"
- **S12 Node version** (L4). "A4: usa Node 24 desde ahora, no esperemos a que falle el deploy. Actualiza la spec y DECISIONS.md."
- **S13 Health check path** (L14). "Sí, renombrá GET /health a GET /status. Es parte de la unidad 1: sumalo como tarea en odd/tasks/01-setup.md, no abras otro documento." / "La ruta queda definida en un solo lugar de cada lado (una constante en el backend y otra en el frontend), así un segundo cambio de nombre es de una línea." / "La línea de DECISIONS.md tiene que decir qué regla bloquea, cómo lo comprobaste, por qué /status y por qué no el proxy por Vercel." / "Spec, código, test y DECISIONS.md van en el mismo commit." / "Decime el orden exacto para que el deploy no falle: cuándo cambio el Health Check Path en Render respecto del push." / "Actualizá la lista de pruebas con /status y sumá una prueba con Brave Shields encendido."
- **S14 Supabase region** (L18). "Sí, movemos Supabase a us-east-1 ahora. Es parte de la unidad 1: sumalo como tarea en odd/tasks/01-setup.md." / "Medí el tiempo de respuesta de /status contra el backend desplegado, ya despierto: tres pedidos seguidos con curl y el tiempo total de cada uno. Quiero el número de antes para compararlo con el de después." / "No me pidas la URL ni la contraseña, y no las muestres." / "Corré la migración contra la base nueva." / "Repetí en el proyecto nuevo las mismas comprobaciones de solo lectura: las cinco tablas, RLS activado en todas, el índice de una ronda abierta por usuario, los advisors de seguridad y la respuesta de la Data API." / "Volvé a medir /status tres veces y pasame el antes y el después." / "Buscá si la referencia del proyecto viejo quedó en algún archivo del repo o en la configuración del MCP, sin abrir los .env." / "Recién con todo eso en verde te confirmo y borro el proyecto viejo. No lo des por borrado antes." / "Una línea en DECISIONS.md: por qué las dos regiones tienen que coincidir, qué se movió y los tiempos medidos antes y después." / "Si la conexión falla por el certificado, frená y mostrame el error. No cambies la configuración de SSL para que pase."

Assumptions, accepted by the author in L4 ("Ok al plan"), with A2, A3 and A4 settled as noted:

- **A1.** Only the files that `/health` and the provisional page need are created. The other folders of 02 §2 and 03 §2 appear with the units that fill them; git does not track empty folders.
- **A2.** Accepted ("A2 ok"). Regions: Render **Virginia** and Supabase **East US (North Virginia) `us-east-1`**, close to each other and to users in Mexico. Render's region cannot be changed later.
- **A3.** Accepted ("A3 ok, el certificado lo bajo yo"). Database TLS is verified against Supabase's root certificate, downloaded by the author and committed as `backend/certs/supabase-ca.crt` (a public certificate, not a secret). The alternative, encrypting without verifying the server, is simpler but weaker. One line goes in `DECISIONS.md`.
- **A4.** Replaced by S12: Node 24 from the start; spec and `DECISIONS.md` updated in T0.
- **A5.** Until unit 2 creates `creditBudget.ts`, `/health` reports `dailyCap: 750` from a named constant.
- **A6.** `pnpm migrate` applies `sql/001_init.sql` in one transaction. Running it twice fails and rolls back with a clear message; there is no migrations table.
- **A7.** Locally the backend listens on `PORT=4000` and the frontend on 3000. Local development and production share the one Supabase database, as 02 §10 already assumes.
- **A8.** The frontend's `pnpm test` runs Vitest with no tests until unit 5 adds the `format.ts` tests.

## Tasks

| ID | Task | Specs | Route | Status | Commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T0 | Spec update for S11 and S12: Node 24 and pnpm in 02 §2, §3, §5.5, §10, 03 §11 and `CLAUDE.md` (with the `prompts/system` copy); two `DECISIONS.md` lines; this document | S11, S12 | inline | done | `4d20746` docs(specs): switch to Node 24 and pnpm |
| T1 | Backend tooling and app skeleton: `package.json` (ESM, Node 24, `packageManager` pnpm, scripts), `pnpm-lock.yaml`, `tsconfig`, ESLint with `typescript-eslint`, Vitest, `.nvmrc`, `env.ts`, `app.ts` exporting `createApp(deps)` (helmet, CORS list, JSON, 404 and error handler), `index.ts`; route tests for 404 and CORS | S1, S3 | inline | done | `8eb214d` feat(backend): scaffold express app with env validation; typecheck, lint, 4 tests, build green; built server answers 404 with helmet headers and CORS only for the listed origin |
| T2 | Schema and migration: `sql/001_init.sql` from 02 §3, pool helper with TLS (A3), `src/scripts/migrate.ts`, `pnpm migrate` | S1, S2 | inline | done | `8a35156` feat(backend): add schema, TLS database pool and migrate script; SQL copied from the 02 §3 block (5 tables, 5 RLS lines); pool loads the CA, max 5; migrate exits 1 without DATABASE_URL; not yet run against Supabase (T7) |
| T3 | `GET /health` per 02 §7, including `db: false`; wired in `index.ts`; supertest route test with in-memory deps | S3 | inline | done | `099ae19` feat(backend): add GET /health; 6 tests green (2 for /health, in-memory deps); built server with an unreachable database answers 200 `{"ok":true,"db":false}` |
| T4 | Frontend scaffold with `create-next-app` (Next.js 16, Tailwind 4, ESLint, App Router, `src/`, pnpm), Node 24, `pnpm test` with Vitest, provisional page that calls `/health` and shows the response, strings in `copy.ts` | S1, S4 | inline | done | `a8c7a1a` feat(frontend): scaffold next app with provisional health page; typecheck, lint, test (no tests yet, A8), build green; in a browser at 390 px the page on :3000 fetched :4000/health across origins and showed `200 {"ok":true,"db":false}` |
| T5 | `CLAUDE.md` Commands section completed; `prompts/system/CLAUDE.md` synced | S9 | inline | done | `docs: fill in the commands section of CLAUDE.md`; copies identical (cmp) |
| T6 | **Author:** Supabase project, Data API off, `DATABASE_URL` in `backend/.env`, CA certificate saved | S2, S6 | author | done, with one deviation | database reachable through the Session pooler with the committed CA (T7); Data API: REST endpoints return `503 PGRST002` and no data, and the security advisors show only the expected INFO `rls_enabled_no_policy` on the 5 tables (L17); **region is `us-west-2` (Oregon), not `us-east-1` as A2 agreed** (L17) |
| T7 | Run the migration against Supabase after T6; evidence: table names and RLS flags, never the URL | S2 | inline | done | `pnpm migrate`: "Applied sql/001_init.sql"; 5 tables with RLS on and 0 policies; both indexes present; a second run fails on `relation "users" already exists` and rolls back; client connection is TLS 1.3, authorized against the Supabase CA, rejected (`SELF_SIGNED_CERT_IN_CHAIN`) without it; Render `/health` then answered `db: true` |
| T8 | **Author:** GitHub repo and push; Render web service; `/health` answers on the Render URL | S4, S6, S8 | author | done | author's checklist results (L10): step 1 `{"ok":true,"db":true,...} 200`, step 4 `0`, step 5 `NOT_FOUND 404` |
| T9 | **Author:** Vercel project; then `CORS_ORIGIN` updated on Render | S4, S6, S8 | author | done | step 2 passed (L10: CORS header for the Vercel origin); step 3 passed (L15: the deployed page shows `https://guess-up-api.onrender.com/status` and `200 { "ok": true, "db": true, ... }`) |
| T10 | Test checklist for both URLs (`/status` after T12, CORS from Vercel and from another origin, unknown route, cold start, Brave Shields on); T8 and T9 marked from the author's results | S8, S9 | inline | done | all 7 steps passed: 1, 2, 4, 5 (L16, against `/status`), 3 (L15), 6 (L22, cold start 17.37 s to first byte), 7 (L23, Brave with Shields on) |
| T11 | Session log `prompts/sessions/01-setup.md` | S9 | inline | done | `docs(prompts): log session 01, work unit 1`; 24 prompts copied from the transcript and checked verbatim by script; no secret values in it |
| T12 | Rename `GET /health` to `GET /status` (S13): one `HEALTH_PATH` constant per side, specs 01 §15, 02 §7 (intro and route), 02 §10 (twice), 03 §8, `DECISIONS.md`, tests, this document | S13 | inline | done | `fix: rename the health check to /status to avoid ad blockers`; backend 7 tests (including `/health` → 404), typecheck, lint and build green; frontend typecheck, lint, test and build green; built server: `/status` 200, `/health` 404 |
| T13 | Move Supabase to `us-east-1` (S14): measure `/status` before (3 warm requests); the author creates the project and loads `DATABASE_URL`; migrate; repeat the read-only checks (5 tables, RLS, `one_open_round_per_user`, security advisors, Data API); measure after; search the repo and the MCP configuration for the old project ref without opening `.env` files; `DECISIONS.md` line; the author deletes the old project only after all of that is green | S14 | inline + author | done (L21) | new project `guess-up-east` in `us-east-1`; migrate applied; 5 tables, RLS on, 0 policies; `one_open_round_per_user` present; TLS 1.3 verified against the committed CA; advisors INFO only; Data API probe `503 PGRST002`, author turned it off in the dashboard; `/status` medians 0.369 s → 0.285 s; old ref absent from the repo and its history |

Route evidence: no writer is delegated. The backend and frontend skeletons are independent, but the frontend is mostly generated by `create-next-app` and its authored part is well under 100 lines, so parallel writers would cost more than they save.

## Author steps

Checked on 2026-11-20 against the current docs of each service (sources in L2). Secrets are typed by the author into each panel or into the local env files; the AI never asks for them or prints them.

### Supabase (T6)

1. New project. Organization: yours. Name: `guess-up`. Database password: let the form generate it and keep it in your password manager. Region: **East US (North Virginia) `us-east-1`**. If the form offers to disable the Data API, disable it.
2. If it is still on: **Integrations → Data API → Overview → Enable Data API**: off. With it off, no auto-generated REST endpoint answers.
3. **Connect** (top of the project) → **Session pooler** → copy the URI. Shape: `postgresql://postgres.<project-ref>:[YOUR-DATABASE-PASSWORD]@aws-<n>-us-east-1.pooler.supabase.com:5432/postgres`. Replace the password placeholder; percent-encode reserved characters. Use the Session pooler: the direct connection is IPv6 only and Render is IPv4.
4. **Database Settings → SSL Configuration → download the certificate**. Save it as `backend/certs/supabase-ca.crt` (A3).
5. Put `DATABASE_URL=<that URI>` in `backend/.env`, then tell me. I run the migration (T7) and show only table names and RLS flags.

Free plan: a project is paused after one week of inactivity; the daily ping is P1.

### GitHub (needed by Render and Vercel)

`atarico/guess-up` does not exist yet. Create it public and push `main`.

### Render (T8)

1. **New → Web Service → Git Provider → GitHub**, pick `guess-up`.
2. **Name:** `guess-up-api` (the URL becomes `https://<name>.onrender.com`; copy the real one). **Region:** Virginia. **Branch:** `main`. **Language:** Node. **Root Directory:** `backend` (if the form does not show it, set it after creating in **Settings → Build & Deploy → Root Directory**). **Build Command:** `corepack enable && pnpm install --frozen-lockfile && pnpm build`. Render's docs do not mention pnpm; corepack installs the version pinned in `packageManager`. If the build log shows `corepack enable` failing, use `npx --yes pnpm@10.33.0 install --frozen-lockfile && npx --yes pnpm@10.33.0 build` instead and tell me. **Start Command:** `node dist/index.js`. **Plan:** Free.
3. **Advanced → Health Check Path:** `/status` (L13, S13; the move from `/health` is the order under "Moving the Render health check to `/status`").
4. **Environment variables:**

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the Session pooler URI from Supabase step 3 |
   | `JWT_SECRET` | the output of `openssl rand -base64 48`, run by you |
   | `TWELVE_DATA_API_KEY` | your Twelve Data key |
   | `CORS_ORIGIN` | `http://localhost:3000` |

   Do not set `PORT` (Render sets 10000), `TRUST_PROXY_HOPS` (unit 3) or `DEMO_EMAIL` / `DEMO_PASSWORD` (unit 7). Node 24 comes from `engines` in `backend/package.json` (Render's default for new services is also 24). Render sets `NODE_ENV=production` only at runtime, so the build still installs the dev dependencies that TypeScript needs.
5. **Create Web Service.** When the deploy is live, `https://<render-url>/health` should answer `{"ok":true,"db":true,...}`.

### Moving Supabase to `us-east-1` (T13)

Checked against supabase.com/docs (connecting to Postgres, securing your API, regions; L2, L17). The AI never asks for or prints the URL or the password (S14).

1. Dashboard → **New project**. Organization: the same. Name: `guess-up-east`, so the two projects are easy to tell apart while both exist (it can be renamed later). Database password: let the form generate it and keep it in your password manager. **Region: East US (North Virginia), `us-east-1`.** If the form offers to disable the Data API, disable it.
2. **Integrations → Data API → Overview → Enable Data API**: off, if it is still on.
3. **Connect** (top of the project) → **Session pooler**. Copy that URI: user `postgres.<new-ref>`, host `aws-<n>-us-east-1.pooler.supabase.com`, **port 5432**. Not "Direct connection" (`db.<ref>.supabase.co`, IPv6 only, Render is IPv4) and not "Transaction pooler" (port 6543). Replace the password placeholder; percent-encode reserved characters; do not add `sslmode` (it would override the CA in `src/db.ts`).
4. `backend/.env`: replace `DATABASE_URL` with that URI.
5. Render → **Environment** → `DATABASE_URL` → the same URI → **Save and deploy** (no rebuild needed). Until the migration runs, `/status` answers `db: false`; that is expected and does not fail the health check.
6. Tell me, without the URL. I migrate and run the checks.
7. Only after I report everything green, and after your confirmation, delete `guess-up` (the `us-west-2` one): its project **Settings → General → Delete project**.

The certificate in `backend/certs/supabase-ca.crt` is Supabase's root CA, expected to be the same for the new project. If the TLS check fails, I stop and show the error without touching the SSL settings (S14).

### Moving the Render health check to `/status` (T12)

Order checked against render.com/docs/health-checks. Pushing first fails: the new instance answers 404 on `/health` and Render cancels the deploy after 15 minutes. Setting `/status` first also fails: the old instance answers 404, Render stops routing to it after 15 seconds of failed checks and restarts it after 60. So:

1. Render → **Settings → Health Checks → Health Check Path**: clear the field and save. Without a path Render falls back to a TCP probe, which old and new code both pass. The docs state the TCP default but not that the field can be cleared; if it cannot, stop and tell me.
2. Push `main`. Wait until the Render deploy is **Live** (and Vercel's, which deploys the same push).
3. `curl -s https://guess-up-api.onrender.com/status` answers `{"ok":true,"db":true,...}`.
4. Render → **Health Check Path** → `/status` → save.

### Vercel (T9)

1. **New Project → import `guess-up`.** **Root Directory:** Edit → `frontend`. **Framework Preset:** Next.js; check it after setting the Root Directory, because at the repository root Vercel finds no framework and selects "Other" (L8). **Output Directory:** no override. Build settings: defaults.
2. **Environment Variables** (Production and Preview): `NEXT_PUBLIC_API_URL` = the Render URL, with no trailing slash. Leave `NEXT_PUBLIC_DEMO_EMAIL` and `NEXT_PUBLIC_DEMO_PASSWORD` unset until unit 7; the demo link stays hidden. Do **not** set `ENABLE_EXPERIMENTAL_COREPACK`: with it, the first build could not enable corepack and fell back to an old pnpm (L7). Install and build commands: defaults; Vercel picks pnpm from `pnpm-lock.yaml` (`lockfileVersion: '9.0'` → pnpm 9 or 10). Node 24.x comes from `engines` in `package.json`.
3. **Deploy.** Copy the production domain from the project's **Domains** (usually `https://<project>.vercel.app`).
4. **Settings → Deployment Protection:** the production domain must open without a Vercel login. Standard Protection leaves it public.
5. **The CORS moment:** right after this first production deploy, go to Render → **Environment** → set `CORS_ORIGIN` to `http://localhost:3000,https://<vercel-domain>` → **Save and deploy** (no rebuild needed). Until then the Vercel page shows a CORS error; that is expected.

`NEXT_PUBLIC_` variables are inlined at build time: if `NEXT_PUBLIC_API_URL` ever changes, redeploy on Vercel.

### Local env files

- `backend/.env`: `DATABASE_URL`, `JWT_SECRET` (a second `openssl rand -base64 48`, not the production one; the code reads only this name), `TWELVE_DATA_API_KEY`, `CORS_ORIGIN=http://localhost:3000`, `PORT=4000`.
- `frontend/.env.local`: only `NEXT_PUBLIC_API_URL=http://localhost:4000`. The session 00 review found backend variable names in this file; they do not belong here.

## Test checklist (T10)

Replace `<render-url>` with the Render service URL and `<vercel-url>` with the Vercel production domain, both with `https://` and no trailing slash. Send me the output of each step; T8 and T9 are marked only from these results (S8).

| # | Command or step | Expected | If it fails |
| --- | --- | --- | --- |
| 1 | `curl -s -w ' %{http_code}\n' <render-url>/status` | `{"ok":true,"db":true,"symbolsReady":0,"credits":{"usedToday":0,"dailyCap":750}} 200` | `db:false`: the service runs but cannot reach Supabase. The Render log line `Health check: database unavailable: <reason>` names the cause: wrong `DATABASE_URL` or password encoding, a TLS error, or a paused project. A timeout or 5xx: the service is not running; read the deploy log. |
| 2 | `curl -s -D - -o /dev/null -H 'Origin: <vercel-url>' <render-url>/status \| grep -i access-control-allow-origin` | `access-control-allow-origin: <vercel-url>` | No line: `CORS_ORIGIN` on Render lacks the Vercel domain (typo, trailing slash, `http` instead of `https`), or the change was saved without redeploying. |
| 3 | Open `<vercel-url>` in a browser, on a phone or at 390 px | The page shows the Render URL and `200 { "ok": true, "db": true, ... }` | `No se pudo conectar con el servidor.`: check step 2 for CORS; if the URL shown on the page is wrong, fix `NEXT_PUBLIC_API_URL` in Vercel and redeploy (it is inlined at build time). |
| 4 | `curl -s -D - -o /dev/null -H 'Origin: https://example.com' <render-url>/status \| grep -ci access-control-allow-origin` | `0` | `1`: `CORS_ORIGIN` lets any origin through (for example `*`); set it to the exact list. |
| 5 | `curl -s -w ' %{http_code}\n' <render-url>/does-not-exist` and `curl -s -w ' %{http_code}\n' <render-url>/health` | `{"error":{"code":"NOT_FOUND","message":"Route not found"}} 404`, twice | A different body: the deploy runs an old build, or the error middleware is missing. `/health` answering 200: the `/status` rename is not deployed yet. |
| 6 | Leave the service without traffic for more than 15 minutes, then `time curl -s -o /dev/null -w '%{http_code}\n' <render-url>/status` | `200`, after a wait of up to about a minute (Render spins free services down after 15 idle minutes) | A long 502 or a timeout: the service crashes on boot. The Render log shows why, for example `Missing or invalid environment variables: ...`. |
| 7 | Open `<vercel-url>` in Brave on the phone with Shields **on** (the default) | The page shows `200 { "ok": true, "db": true, ... }`, as with Shields off | "Failed to fetch" again: another rule in Brave's lists matches `/status` or the domain; tell me, and the next step is the proxy through Vercel that `DECISIONS.md` set aside. |

Preview deployments on Vercel have other URLs that are not in `CORS_ORIGIN`, so step 3 fails on them by design; test the production domain.

## Log

- **L1** (2026-11-20, author's request, verbatim; typed line, then pasted text):

````text
ok pushea lo commiteado, actualiza y despues esto

Arrancamos con la unidad 1 de la sección 15 de 01-product.md. Presupuesto: 30 minutos. Si algo se va de eso, avisame en vez de seguir.

Qué tiene que quedar funcionando
- La estructura de backend/ y frontend/ según 02 §2 y 03 §2, con los comandos de CLAUDE.md andando (typecheck, lint, build, test).
- El schema de 02 §3 aplicado en Supabase.
- GET /health según 02 §7, con app.ts exportando createApp(deps) y un test de ruta que no toque red ni base.
- Los dos esqueletos desplegados y conectados entre sí: el frontend desplegado muestra una página mínima que llama a /health del backend desplegado y enseña la respuesta. Esa página es provisoria y se reemplaza en la unidad 5; sirve para comprobar NEXT_PUBLIC_API_URL y CORS de punta a punta.

Qué no entra
Autenticación, rondas, cliente de Twelve Data, seed, universe.ts, pantallas reales y diseño. Si algo de eso parece necesario para terminar, frená y decímelo.

Cómo quiero que corra ODD en esta unidad
- Es trabajo sustancial: creá el documento en odd/tasks/01-setup.md antes de escribir código. Ese documento es el plan; no me armes otro aparte.
- Cuando lo tengas, frená antes de la primera escritura de código. Pasame un resumen de no más de 15 líneas con las tareas y con lo que necesitás de mí, y esperá mi ok.
- TDD no aplica acá: no hay código de dominio. Alcanzan los chequeos funcionales.
- Política de entrega para esta prueba: se trabaja directo sobre main, sin rama de feature ni PR. Un commit por tarea, con Conventional Commits. Si la unidad pasa de 400 líneas propias, seguí igual: no la partas ni me preguntes por eso.
- Antes de cada commit comprobá que no haya ningún .env en el stage. El push lo hago yo.
- Las tareas de deploy dependen de mí. Dejalas pendientes en el documento y marcalas recién cuando te pase el resultado de la lista de pruebas. No las des por hechas sin esa evidencia.

Lo que hago yo, con tus instrucciones
Los servicios de Supabase, Render y Vercel los creo yo. Dame los pasos y los valores exactos de cada uno: directorio raíz, comandos de build y de arranque, ruta del health check, región, versión de Node y la lista completa de variables de entorno con qué va en cada una. Verificá los pasos contra la documentación actual de cada servicio, no de memoria. Tené en cuenta:
- Los secretos los cargo yo en cada panel. No me pidas valores ni los imprimas. Para JWT_SECRET pasame el comando para generarlo y lo corro yo.
- CORS_ORIGIN arranca con localhost y se le agrega la URL de Vercel después del primer deploy: decime en qué momento.
- TRUST_PROXY_HOPS no se toca hasta la unidad 3.
- La migración contra Supabase la corrés vos, recién cuando te confirme que DATABASE_URL está en backend/.env, y sin mostrar la URL.

Al cerrar
- Una lista para probar contra las dos URLs: comando o paso, resultado esperado y qué significa si falla. Que cubra /health, CORS desde el origen de Vercel y desde otro origen, una ruta inexistente y el arranque en frío.
- La sección Commands de CLAUDE.md completada, con la copia de prompts/system sincronizada.
- La sesión registrada en prompts/sessions/01-setup.md.
````

- **L2** (2026-11-20, research). Service facts checked in the current docs: Render web services, free tier, Node version, health checks, environment variables, regions and deploys (render.com/docs); Vercel import, build configuration, environment variables, Node versions, generated URLs, deployment protection and monorepos (vercel.com/docs); Supabase connecting to Postgres, SSL enforcement, securing the Data API, RLS, regions and the free plan (supabase.com/docs). Gaps the docs left open: Node 26 on Render (A4); whether Render's creation form shows Root Directory; Vercel's default production domain format; Supabase says `postgres` has `bypassrls` but not explicitly for the pooler user.
- **L3** (2026-11-20). `odd/tasks/01-setup.md` created before any code. Stopped for the author's ok, as L1 asks.
- **L4** (2026-11-20, author, verbatim; typed lines, then pasted text):

````text
Si ya lo habia corregido quedo asi 'https://github.com/atarico/guess-up'

Una aclaracion vamos a usar pnpm como gestor no npm

Ok al plan, no cortes alcance. El tiempo de mas lo explico en el README.
A2 ok: Render en Virginia y Supabase en us-east-1.
A3 ok, el certificado lo bajo yo.
A4: usa Node 24 desde ahora, no esperemos a que falle el deploy. Actualiza la spec y DECISIONS.md.
````

- **L5** (2026-11-20). Remote: the author renamed the GitHub repository to `atarico/guess-up`; `origin` now points there and holds `83757d7`. Local tools: Node 24.14.1, pnpm 10.33.0, corepack 0.34.6. Research for S11: Render's docs do not mention pnpm or corepack (render.com/docs: deploy-node-express-app, node-version, environment-variables, language-support), so the Render build enables corepack and a fallback is written in the author steps; Vercel detects pnpm from `pnpm-lock.yaml` and honours `packageManager` when `ENABLE_EXPERIMENTAL_COREPACK=1` (vercel.com/docs/package-managers, builds/configure-a-build); pnpm.io now documents v11 and later, so how pnpm 10 treats dependency build scripts is checked on the first install.
- **L6** (2026-11-20). T0 to T5 done, one commit each on `main`, not pushed (S7): `4d20746`, `8eb214d`, `8a35156`, `099ae19`, `a8c7a1a`, `cf711ea`. Before every commit a script checked that no `.env` file was staged; its first version gave a false positive because this `grep -qv` returns 0 on empty input, so it now counts lines. TypeScript is pinned to 6.0 in the backend because `typescript-eslint` does not support 7 (`DECISIONS.md`). `create-next-app` refuses a folder holding `.env` files, which the AI may not move, so the app was generated in the scratchpad and copied. Its generated `.gitignore` had `.env*`, which would hide `frontend/.env.example`; `!.env.example` was added. The author had already saved `backend/certs/supabase-ca.crt` (Supabase Root 2021 CA, valid to 2031, no private key); it is committed. About 70 minutes since the unit 1 request, against a 30-minute budget the author accepted to exceed (L4).
- **L7** (2026-11-20). The author pushed `main` (`origin/main` = `cf711ea`) and reports Render live at `https://guess-up-api.onrender.com`; the AI's GET `/health` there answered `200 {"ok":true,"db":false}` in 0.75 s, expected until the migration creates the tables. The local secret sits in `backend/.env` as `JWT_SECRET_LOCAL`, which the code does not read; `JWT_SECRET` is also set there, and `PORT` is empty, so `pnpm dev` would stop at boot. The first Vercel build failed: "Could not enable corepack because package.json is missing "packageManager" property", then "Ignoring not compatible lockfile at /vercel/path0/frontend/pnpm-lock.yaml" and `ERR_PNPM_META_FETCH_FAIL ... Value of "this" must be of type URLSearchParams`. The pushed `frontend/package.json` does have `packageManager: pnpm@10.33.0`, so Vercel looked for it elsewhere (most likely the repository root, which has no `package.json`; inferred, not documented). The lockfile warning and the URLSearchParams error are typical of a pnpm older than 9 running on a recent Node. Cause on the AI's side: the author steps told the author to set `ENABLE_EXPERIMENTAL_COREPACK=1` without checking how it works with a Root Directory. Plan: remove that variable and redeploy; if the build still picks an old pnpm, pin pnpm 10.33.0 in `frontend/vercel.json` install and build commands.
- **L8** (2026-11-20). With `ENABLE_EXPERIMENTAL_COREPACK` removed, the second Vercel build detected pnpm correctly ("Detected `pnpm-lock.yaml` version 9 generated by pnpm@10.x from package.json#packageManager pnpm@10.33.0", "Done in 12.7s using pnpm v10.33.0") and `next build` succeeded. It then failed with `[STATIC_BUILD_NO_OUT_DIR] No Output Directory named "public" found`: Vercel looks for `public` when the Framework Preset is "Other" or the Output Directory is overridden (vercel.com/docs/errors/error-list#missing-public-directory, vercel.com/docs/deployments/configure-a-build). Fix: Settings → Build and Deployment → Framework Settings → Framework Preset = Next.js, Output Directory override off, then redeploy.
- **L9** (2026-11-20). The author set the Vercel Framework Preset to Next.js and the deploy went live at `https://guess-up-frontend-kappa.vercel.app`; Render `CORS_ORIGIN` is now `http://localhost:3000, https://guess-up-frontend-kappa.vercel.app` (the space is trimmed by `env.ts`). The author fixed `backend/.env` (`JWT_SECRET` set, `JWT_SECRET_LOCAL` gone, `PORT=4000`) and wrote "esas configs ya estan en el .env del back", which the AI took as the S2 confirmation. Shape check without values: Session pooler host, port 5432, user `postgres.<ref>`, no `sslmode`. T7 ran (evidence in the task row). `pg_stat_ssl` reports `ssl: false`, but it describes the pooler-to-Postgres link, not ours, so the client socket was checked instead. The AI's own probes, which do not replace the author's checklist (S8): the Vercel origin gets `access-control-allow-origin`, `https://example.com` gets none, the Vercel page answers 200. `DECISIONS.md` corrects the corepack line.
- **L10** (2026-11-20). Author's checklist output, verbatim:

````text
{"ok":true,"db":true,"symbolsReady":0,"credits":{"usedToday":0,"dailyCap":750}} 200
access-control-allow-origin: https://guess-up-frontend-kappa.vercel.app
0
{"error":{"code":"NOT_FOUND","message":"Route not found"}} 404
200
curl -s -o /dev/null -w '%{http_code}\n' $R/health  0,02s user 0,01s system 10% cpu 0,368 total
````

Steps 1, 2, 4 and 5 pass, so T8 is marked. Step 3 (the page in a browser) is missing from the output, so T9 stays open. Step 6 answered in 0.368 s, so the service was awake and no cold start was observed; it has to be repeated after more than 15 minutes with no traffic at all. The AI's own browser check at 390 px (extra evidence, not a substitute for S8): the page ends up showing `200 { "ok": true, "db": true, "symbolsReady": 0, ... }`, and the browser's resource timing put the request at 369 ms. Accessibility snapshots kept showing "Consultando el servidor…" for more than 8 s, which points to the test browser rather than the network; the cause was not found.
- **L11** (2026-11-20). Step 3 on the author's phone, verbatim:

````text
Comprobación del servidor
https://guess-up-api.onrender.com/health

No se pudo conectar con el servidor. Failed to fetch
````

"Failed to fetch" is Chromium's message for a network error or a CORS rejection; the browser hides which. The same request with the production origin passed steps 2 and 4 by curl, and the AI's browser got 200 from the production domain. Two causes fit, pending two facts from the author: (a) the phone was not on the production domain (for example a deployment URL opened from the Vercel dashboard), whose origin is not in `CORS_ORIGIN`; (b) the request hit Render while it was spun down and got a response without CORS headers. T9 stays open.
- **L12** (2026-11-20). After a reload the phone (Brave on Android, Shields on) is on the production domain `guess-up-frontend-kappa.vercel.app` and still shows "Failed to fetch", so cause (a) is ruled out. A curl that imitates Chrome on Android, sent with the production origin at the same moment, got `200` in 0.38 s with `access-control-allow-origin: https://guess-up-frontend-kappa.vercel.app`, so cause (b) does not explain a failure that survives the reload. New candidate: Brave Shields blocking the cross-site request. Test 1, opening `https://guess-up-api.onrender.com/health` directly in Brave on the phone, shows the JSON with `db: true`: the phone reaches Render, so the network and DNS are fine.
- **L13** (2026-11-20). Test 2: with Shields off, the page on the production domain shows the `/health` response ("con shields apagado muestra lo mismo"). Cause found in the public lists: EasyPrivacy, which Brave Shields applies by default and uBlock Origin enables by default, has `||onrender.com/health` (line 12668 of easyprivacy.txt; source file `easyprivacy/easyprivacy_thirdparty.txt`). It blocks every cross-site request to a `*.onrender.com/health…` path, `/healthz` and `/health-check` included. A rough matcher over EasyPrivacy and EasyList (about 104k network rules, filtered by request type and options; it does not cover every list Brave uses) blocks only the `/health*` paths. `/status`, `/ping`, `/api/health` and every route planned in 02 §7 (`/auth/*`, `/rounds`, `/rounds/:id/decision`, `/rounds/:id/live`, `/stats`) pass. This matters beyond the provisional page: the unit 8 cold-start screen polls the same path (03 §8). NEXT_PUBLIC_API_URL and CORS work end to end with Shields off. Needs the author's decision: rename the endpoint (spec change) or another route.
- **L14** (2026-11-20, author, verbatim):

````text
Sí, renombrá GET /health a GET /status. Es parte de la unidad 1: sumalo como tarea en odd/tasks/01-setup.md, no abras otro documento.

- Antes de editar, buscá todas las menciones de /health en las specs, en CLAUDE.md y en el código, no solo las tres secciones que nombraste: también aparece en 01 §15 y en la introducción de 02 §7. Pasame la lista de lo que cambiaste.
- La ruta queda definida en un solo lugar de cada lado (una constante en el backend y otra en el frontend), así un segundo cambio de nombre es de una línea.
- La línea de DECISIONS.md tiene que decir qué regla bloquea, cómo lo comprobaste, por qué /status y por qué no el proxy por Vercel.
- Spec, código, test y DECISIONS.md van en el mismo commit.
- Decime el orden exacto para que el deploy no falle: cuándo cambio el Health Check Path en Render respecto del push.
- Actualizá la lista de pruebas con /status y sumá una prueba con Brave Shields encendido.
````

Mentions of `/health` found before editing: 01 §15; 02 §7 (intro and the route heading); 02 §10 (Render health check path, daily ping); 03 §8; `backend/src/routes/health.ts`; `backend/test/health.test.ts`; `frontend/src/app/page.tsx`. None in `CLAUDE.md`. Left as they are, on purpose: the file and function names `routes/health.ts` / `healthRouter` (they name the concept, not the path); 01 §11 "Daily health ping" (concept); earlier `DECISIONS.md` lines and session logs (history). Render's order was checked in its docs (task T12 and "Moving the Render health check to `/status`").
- **L15** (2026-11-20). The author's browser, on the deployed page, verbatim:

````text
https://guess-up-api.onrender.com/status

200 {
  "ok": true,
  "db": true,
  "symbolsReady": 0,
  "credits": {
    "usedToday": 0,
    "dailyCap": 750
  }
}
````

The new frontend and backend are deployed and the page shows the response, so step 3 passes and T9 is marked. Not stated: which browser and whether Shields was on (step 7), whether Render's Health Check Path is now `/status`, and the re-run of steps 1, 2, 4 and 5 against `/status`.
- **L16** (2026-11-20). Steps 1, 2, 4 and 5 re-run against `/status`, author's output verbatim:

````text
{"ok":true,"db":true,"symbolsReady":0,"credits":{"usedToday":0,"dailyCap":750}} 200
access-control-allow-origin: https://guess-up-frontend-kappa.vercel.app
0
{"error":{"code":"NOT_FOUND","message":"Route not found"}} 404
{"error":{"code":"NOT_FOUND","message":"Route not found"}} 404
````

All four pass, and `/health` now answers 404 in production, so the rename is deployed.
- **L17** (2026-11-20). The author: "ya autoricé, en render dice /status y sí era Brave". Render's Health Check Path is `/status`, so the move in T12 is complete. The L15 capture was taken in Brave, but in test 2 (L13) Shields was turned off for this site and Brave remembers that per site, so step 7 still needs Shields confirmed on. Supabase checked through its MCP (read-only tools): the project `guess-up` is `ACTIVE_HEALTHY`, Postgres 17, **region `us-west-2`**, created 2026-11-20 00:48 UTC, before A2 was agreed. Render is in Virginia, so every query crosses the continent. Security advisors: only `rls_enabled_no_policy` (INFO) on `api_usage`, `daily_closes`, `rounds`, `symbols` and `users`, which is the intended state. Data API probe with the publishable key (public by design; redacted in logs): `/rest/v1/` → 401 "Secret API key required"; `/rest/v1/users` and `/rest/v1/symbols` → `503 PGRST002` "Could not query the database for the schema cache". Supabase's docs say that with the Data API disabled "none of the auto-generated REST endpoints respond, regardless of grants or RLS"; the observation matches that, but PGRST002 is not documented as the marker of a disabled API, so the dashboard toggle stays the definitive check. Either way, no row is readable through it. A zsh slip on the AI's side: a loop variable named `path` overwrote `PATH`; renamed and re-run. The idle timer for step 6 started at 06:46:19 UTC, not at the time first told to the author; the request goes at about 07:02 UTC.
- **L18** (2026-11-20, author, verbatim):

````text
Sí, movemos Supabase a us-east-1 ahora. Es parte de la unidad 1: sumalo como tarea en odd/tasks/01-setup.md.

Antes de que yo toque nada
- Medí el tiempo de respuesta de /status contra el backend desplegado, ya despierto: tres pedidos seguidos con curl y el tiempo total de cada uno. Quiero el número de antes para compararlo con el de después.

Lo que hago yo
- Creo el proyecto nuevo en us-east-1 con la Data API apagada, cargo la DATABASE_URL nueva en backend/.env y en Render, y te aviso. Pasame los pasos exactos del dashboard y recordame qué cadena de conexión copiar (la del pooler en modo sesión, no la directa).
- No me pidas la URL ni la contraseña, y no las muestres.

Lo que hacés vos cuando te avise
- Corré la migración contra la base nueva.
- Repetí en el proyecto nuevo las mismas comprobaciones de solo lectura: las cinco tablas, RLS activado en todas, el índice de una ronda abierta por usuario, los advisors de seguridad y la respuesta de la Data API.
- Volvé a medir /status tres veces y pasame el antes y el después.
- Buscá si la referencia del proyecto viejo quedó en algún archivo del repo o en la configuración del MCP, sin abrir los .env.

Recién con todo eso en verde te confirmo y borro el proyecto viejo. No lo des por borrado antes.

Registro
- Una línea en DECISIONS.md: por qué las dos regiones tienen que coincidir, qué se movió y los tiempos medidos antes y después.
- Si la conexión falla por el certificado, frená y mostrame el error. No cambies la configuración de SSL para que pase.
````

The step 6 timer was still running (request at about 07:02 UTC), so the before-measurement waits for it: measuring earlier would wake Render and void the cold-start test.
- **L19** (2026-11-20). Step 6, run by the AI: idle timer from 06:46:19 UTC, request at 07:02:19 UTC → `200` in 0.371 s (first byte 0.371 s), then a second request in 0.361 s. No spin-up delay, so no cold start was observed even after 16 minutes. Either something reached the service in that window (the author had been asked to re-check the page in Brave) or Render had not spun it down; nothing in the app logs requests, so this cannot be told apart. Step 6 stays open. T13 before-measurement (07:02 UTC, Render in Virginia, Supabase in `us-west-2`, measured from the author's machine in Argentina): `/status` 0.459 s, 0.369 s, 0.347 s; baseline without database, `/does-not-exist` → 404: 0.283 s, 0.549 s, 0.228 s. Medians 0.369 s and 0.283 s, so the database part of `/status` is about 0.09 s. Three samples are noisy; the after-measurement uses the same commands.
- **L20** (2026-11-20). The author: "listo", then "revisa de nuevo lo de la data api porque la apague". `backend/.env` points at the new project (shape check: `us-east-1` Session pooler host, port 5432, `postgres.<ref>`, not the old ref, no `sslmode`). `pnpm migrate`: "Applied sql/001_init.sql". Read-only checks on `guess-up-east` (`us-east-1`, `ACTIVE_HEALTHY`): 5 tables, RLS on, 0 policies; `one_open_round_per_user` is `UNIQUE ... (user_id) WHERE (decision IS NULL)`; TLS 1.3, authorized against the committed CA (same root, no certificate change); security advisors: only INFO `rls_enabled_no_policy` on the 5 tables. Data API: the probe gives `503 PGRST002` before and after the author's toggle, and PostgREST 14.18 stays connected as `authenticator`, so neither the probe nor SQL can tell on from off; the dashboard toggle, which the author turned off, is the evidence, and no row is readable either way. Found on the way: `anon` and `authenticated` hold Supabase's default grants on the `public` tables, `TRUNCATE` included; RLS covers row access and the Data API has no truncate endpoint, so nothing is exposed today; revoking those grants would be one more layer (proposal, not done). After-measurement (07:07 UTC): `/status` 0.285 / 0.331 / 0.238 s, `/does-not-exist` 0.215 / 0.219 / 0.496 s; 15 interleaved pairs: `/status` median 222 ms, no-database 206 ms, pairwise difference median 11 ms. Old ref `kdlntnnyviylmycpazrz`: not in the working tree (`.env` files excluded), not in the tracked `.env.example` files, not in the git history; it is in `~/.claude.json`, in two project-scoped MCP servers named `supabase` (`https://mcp.supabase.com/mcp?project_ref=kdlntnnyviylmycpazrz&read_only...`), one for `~/Escritorio` and one for this repo. The old project no longer appears in the MCP project list, and reading it returns "You do not have permission"; whether it was deleted is for the author to say. `DECISIONS.md` has the region line.
- **L21** (2026-11-20). The author: "sí, ya lo borré; actualizá las entradas del MCP". The old `us-west-2` project is deleted (author; consistent with it missing from the MCP project list). Both local-scope MCP servers named `supabase` (this repo and `~/Escritorio`) were replaced with `claude mcp remove supabase -s local` and `claude mcp add -s local -t http supabase "https://mcp.supabase.com/mcp?project_ref=tczeaklxxkyrjqafifbi&read_only=true&features=database,docs,debugging"`, keeping the same options; `claude mcp get supabase` shows the new URL in both, and `~/.claude.json` has no mention of the old ref left. Those entries still need their own sign-in, as before. T13 done.
- **L22** (2026-11-20). Step 6, run by the AI with a strict no-traffic window: last known request about 07:08 UTC, timer from 07:11:07, request at 07:28:07 → `200`, connect 0.037 s, **first byte 17.37 s**; the next request took 0.29 s. Render had spun the service down and woke it in about 17 seconds, within the "up to about a minute" of step 6. Step 6 passes. Steps 1 to 6 have now passed; only step 7 (Brave with Shields on) is left for T10.
- **L23** (2026-11-20). Step 7, the author's Brave on the phone with Shields on, verbatim:

````text
Comprobación del servidor
https://guess-up-api.onrender.com/status

200 {
  "ok": true,
  "db": true,
  "symbolsReady": 0,
  "credits": {
    "usedToday": 0,
    "dailyCap": 750
  }
}
````

The renamed health check gets through Brave Shields. T10 done: every step of the checklist passed.
- **L24** (2026-11-20). T11 written: `prompts/sessions/01-setup.md`, 24 prompts in order (two partial sends and one repeat that got no answer included as sent; the mid-turn message from the transcript's queue). `origin/main` is at `3630fe3`; `f7e7e06`, `b210162` and the log commit are for the author to push. All tasks T0–T13 are done. Open for later units, not unit 1 scope: revoking the default `anon`/`authenticated` grants (L20, proposal) and the per-request log line of 02 §8.
- **L25** (2026-11-20). Receipt-driven review: `gentle-ai review mode status` reports it on (global). The AI had not assessed each work-unit commit as the protocol asks; it assessed the whole unit afterwards: `gentle-ai review assess --base-ref 83757d7 --committed-only` → `risk: medium` (reason `executable_change` on `CLAUDE.md`), 43 paths, 9124 changed lines (mostly the two lockfiles), `review_due: false`, `review_due_reason: under_budget`. No native review is due; the range stays pending until a later commit reaches the budget. Medium tier: the writer's own checks stand.
- **Next:** none for unit 1. The author pushes; work unit 2 is next in `01-product.md` §15. The author pushes `main`, creates Render (T8) and Vercel (T9), runs the checklist and sends the results → T10, then T11.

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
| T2 | Schema and migration: `sql/001_init.sql` from 02 §3, pool helper with TLS (A3), `src/scripts/migrate.ts`, `pnpm migrate` | S1, S2 | inline | done | `feat(backend): add schema, TLS database pool and migrate script`; SQL copied from the 02 §3 block (5 tables, 5 RLS lines); pool loads the CA, max 5; migrate exits 1 without DATABASE_URL; not yet run against Supabase (T7) |
| T3 | `GET /health` per 02 §7, including `db: false`; wired in `index.ts`; supertest route test with in-memory deps | S3 | inline | pending | |
| T4 | Frontend scaffold with `create-next-app` (Next.js 16, Tailwind 4, ESLint, App Router, `src/`, pnpm), Node 24, `pnpm test` with Vitest, provisional page that calls `/health` and shows the response, strings in `copy.ts` | S1, S4 | inline | pending | |
| T5 | `CLAUDE.md` Commands section completed; `prompts/system/CLAUDE.md` synced | S9 | inline | pending | |
| T6 | **Author:** Supabase project, Data API off, `DATABASE_URL` in `backend/.env`, CA certificate saved | S2, S6 | author | pending | |
| T7 | Run the migration against Supabase after T6; evidence: table names and RLS flags, never the URL | S2 | inline | pending | |
| T8 | **Author:** GitHub repo and push; Render web service; `/health` answers on the Render URL | S4, S6, S8 | author | pending, marked only on checklist results | |
| T9 | **Author:** Vercel project; then `CORS_ORIGIN` updated on Render | S4, S6, S8 | author | pending, marked only on checklist results | |
| T10 | Test checklist for both URLs (`/health`, CORS from Vercel and from another origin, unknown route, cold start); T8 and T9 marked from the author's results | S8, S9 | inline | pending | |
| T11 | Session log `prompts/sessions/01-setup.md` | S9 | inline | pending | |

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
3. **Advanced → Health Check Path:** `/health`.
4. **Environment variables:**

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the Session pooler URI from Supabase step 3 |
   | `JWT_SECRET` | the output of `openssl rand -base64 48`, run by you |
   | `TWELVE_DATA_API_KEY` | your Twelve Data key |
   | `CORS_ORIGIN` | `http://localhost:3000` |

   Do not set `PORT` (Render sets 10000), `TRUST_PROXY_HOPS` (unit 3) or `DEMO_EMAIL` / `DEMO_PASSWORD` (unit 7). Node 24 comes from `engines` in `backend/package.json` (Render's default for new services is also 24). Render sets `NODE_ENV=production` only at runtime, so the build still installs the dev dependencies that TypeScript needs.
5. **Create Web Service.** When the deploy is live, `https://<render-url>/health` should answer `{"ok":true,"db":true,...}`.

### Vercel (T9)

1. **New Project → import `guess-up`.** **Framework Preset:** Next.js. **Root Directory:** Edit → `frontend`. Build settings: defaults.
2. **Environment Variables** (Production and Preview): `NEXT_PUBLIC_API_URL` = the Render URL, with no trailing slash. Leave `NEXT_PUBLIC_DEMO_EMAIL` and `NEXT_PUBLIC_DEMO_PASSWORD` unset until unit 7; the demo link stays hidden. Also add `ENABLE_EXPERIMENTAL_COREPACK` = `1`, so Vercel uses the pnpm version in `packageManager` instead of guessing from the lockfile. Install and build commands: defaults (Vercel runs `pnpm install` because of `pnpm-lock.yaml`). Node 24.x comes from `engines` in `package.json`.
3. **Deploy.** Copy the production domain from the project's **Domains** (usually `https://<project>.vercel.app`).
4. **Settings → Deployment Protection:** the production domain must open without a Vercel login. Standard Protection leaves it public.
5. **The CORS moment:** right after this first production deploy, go to Render → **Environment** → set `CORS_ORIGIN` to `http://localhost:3000,https://<vercel-domain>` → **Save and deploy** (no rebuild needed). Until then the Vercel page shows a CORS error; that is expected.

`NEXT_PUBLIC_` variables are inlined at build time: if `NEXT_PUBLIC_API_URL` ever changes, redeploy on Vercel.

### Local env files

- `backend/.env`: `DATABASE_URL`, `JWT_SECRET` (a second `openssl rand -base64 48`, not the production one), `TWELVE_DATA_API_KEY`, `CORS_ORIGIN=http://localhost:3000`, `PORT=4000`.
- `frontend/.env.local`: only `NEXT_PUBLIC_API_URL=http://localhost:4000`. The session 00 review found backend variable names in this file; they do not belong here.

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
- **Next:** T0, then T1.

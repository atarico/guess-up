# 03 — Frontend spec

Implements `01-product.md` against the API in `02-backend.md`. Next.js (App Router), TypeScript strict, Tailwind. Deployed on Vercel.

This spec is in English. **The interface is in Spanish.** Every string in a code span or a "Text" column below is the exact copy to ship.

## 1. What matters most

1. A round takes ten seconds and one thumb.
2. The chart is the hero. Nothing competes with it before the decision.
3. The interface never nudges: Buy and Pass are equals, and colour arrives only with the truth.
4. The verdict sentence is the most carefully set piece of text in the app.

## 2. Structure

```
frontend/src/
├── app/
│   ├── layout.tsx          fonts, metadata, <html lang="es-MX">, <AuthProvider>
│   ├── page.tsx            welcome (redirects to /play when signed in)
│   ├── login/page.tsx      log in / sign up, one form with a mode switch
│   ├── play/page.tsx       the game and the reveal
│   └── stats/page.tsx      the scoreboard
├── components/
│   ├── Chart.tsx           SVG line chart, sealed and revealed states
│   ├── DecisionButtons.tsx
│   ├── RevealCard.tsx
│   ├── Verdict.tsx         the sentence
│   ├── CoinRange.tsx       coin band with the user's marker
│   ├── RoundList.tsx       (P1)
│   └── ServerWaking.tsx
└── lib/
    ├── api.ts              fetch wrapper: base URL, bearer token, errors, wake retry
    ├── api-types.ts        mirrors the backend contract by hand
    ├── auth.tsx            AuthProvider, useAuth, token storage
    ├── format.ts           percent, points, dates, money (es-MX)
    └── copy.ts             every user-facing string, in Spanish
```

- The game screens are client components. The token lives in the browser, so data is fetched client-side; there is no server-side data fetching to defend. Next.js is used because the brief prefers it and it gives routing and a Vercel deploy for free. Say this plainly in the README.
- State is `useState` and one auth context. No state library, no data-fetching library, no chart library.
- All strings come from `copy.ts`, including error text, page titles and accessibility labels. No Spanish literal appears in a component. Identifiers and comments stay in English.
- Tailwind 4, the version `create-next-app` installs by default. Node version as in `02-backend.md` §2.

## 3. Copy rules

- **Neutral Spanish for users in Mexico.** Address the user as *tú*. Never voseo: no "comprá", "mirá", "tenés", "podés". No regional slang ("volado").
- Vocabulary: *gráfica* (never "gráfico"), *acción* for a stock, *correo* for email, *racha* for streak, *lanzar una moneda* for a coin flip.
- Button labels are infinitives: `Comprar`, `Pasar`, `Reintentar`. Sentence case. No exclamation marks.
- *Puntos porcentuales* in the verdict sentence; *puntos* everywhere else. Both always mean percentage points.
- Tickers, company names and exchange names are shown as the API returns them (names from the curated universe, exchanges from the provider; `02-backend.md` §5.5). Sector names arrive in English and are mapped to Spanish in `copy.ts`, falling back to the raw value: Technology → `Tecnología`, Health Care → `Salud`, Financials → `Finanzas`, Energy → `Energía`, Industrials → `Industria`, Consumer Discretionary → `Consumo discrecional`, Consumer Staples → `Consumo básico`, Communication Services → `Comunicaciones`, Utilities → `Servicios públicos`, Materials → `Materiales`, Real Estate → `Bienes raíces`.
- The API's `error.message` is English and is never shown. The interface maps `error.code` to its own text (§8).
- Prices are US dollars, written `USD 184.20`. A bare `$` is never used: in Mexico it reads as pesos. Nothing is converted.

## 4. Visual direction

A dark phone app, quiet until the reveal (the author's design canvas "Guess-Up · app móvil", work unit 10). The accent marks what is yours: your line, your picks, your edge. Up and down appear only after a decision; gold is the coin and the question.

| Token | Value | Use |
| --- | --- | --- |
| `page` | `#0B0F17` | page background |
| `surface` | `#131926` | cards, secondary buttons |
| `raised` | `#161D2B` | the decision buttons, the logo tile |
| `well` | `#1C2436` | bar tracks, the ticker box, the progress track |
| `line` / `line-strong` / `edge` | `#1F2838` / `#2A3550` / `#34415F` | card borders; chips and axes; the decision buttons' border |
| `grid` | `#151C2A` | the chart's hairlines |
| `fg` / `muted` / `faint` | `#EEF1F6` / `#A3AEC2` / `#8E9AAF` | text; secondary text; tertiary labels |
| `past` / `cut` | `#6E7B94` / `#5A6985` | the history line after the reveal; the cutoff line |
| `off` / `passed` | `#3A465C` / `#66738C` | coin bins outside the 90% range; the "passed" bar |
| `accent` / `accent-hover` | `#8FA8FF` / `#B4C4FF` | your line before the reveal, your figures, the primary button, focus |
| `gold` | `#F2C14E` | the coin, the `?`, the demo banner |
| `up` / `down` | `#3DDC97` / `#FF6B6B` | revealed gain and loss; never before the decision |

- Type: Inter for text and figures, Space Grotesk for titles, buttons and the big numbers, both via `next/font`. Every number uses tabular figures, so it does not jitter as it changes.
- Cards and buttons have 16 px corners; buttons are 56 px tall, the decision buttons 64 px.
- Gains and losses are never signalled by colour alone: always a sign and an arrow (`▲ +18.4%`, `▼ −12.4%`).
- One theme, dark. No light mode in this version.
- Motion: the chart drawing in, the reveal, the stats' bars and the waking screen. Honour `prefers-reduced-motion` by showing the final state at once.

## 5. Screens

### 5.1 Welcome `/`

| Element | Text |
| --- | --- |
| Picture | A year of an invented line, the hidden three months with a gold `?` and two dotted possible futures (`components/WelcomeChart.tsx`); `aria-label` `Gráfica anónima de un año de precios; los tres meses siguientes están ocultos` |
| Under the picture | `Un año, sin nombre ni fechas` · `3 meses después` |
| Headline | `¿De verdad sabes leer una gráfica?` |
| One line | `Una gráfica real y anónima, cortada en una fecha pasada al azar. Compras o pasas. Después, la verdad.` |
| Primary action (to sign up) | `Crear cuenta` |
| Secondary action | `Iniciar sesión` |
| Text link | `Probar la cuenta demo` |
| Footer, small | `Precios históricos reales de Twelve Data. Esto no es asesoría de inversión.` |

Signed-in visitors go straight to `/play`.

### 5.2 Log in / sign up `/login`

One form: email, password, submit. A switch toggles between the two modes.

| Element | Create account | Log in |
| --- | --- | --- |
| Title and submit button | `Crear cuenta` | `Iniciar sesión` |
| Submit while in progress | `Creando cuenta…` | `Entrando…` |
| Mode switch | `¿Ya tienes cuenta? Inicia sesión` | `¿No tienes cuenta? Crea una` |

| Element | Text |
| --- | --- |
| Email label | `Correo electrónico` |
| Password label | `Contraseña` |
| Password hint (create mode) | `Mínimo 8 caracteres.` |
| Demo link | `Probar la cuenta demo` |
| `EMAIL_TAKEN` | `Ya existe una cuenta con ese correo.` |
| `INVALID_CREDENTIALS` | `Correo o contraseña incorrectos.` |
| `VALIDATION` | `Revisa el correo y la contraseña. La contraseña debe tener al menos 8 caracteres.` |
| `RATE_LIMITED` | `Demasiados intentos. Espera unos minutos e intenta de nuevo.` |

- Demo link fills the demo credentials and submits. The credentials come from `NEXT_PUBLIC_DEMO_EMAIL` and `NEXT_PUBLIC_DEMO_PASSWORD`. **When either is unset, the demo link is not rendered**, here and on the welcome screen. A link that cannot work is never shown. An empty value counts as unset. Both are copied into the bundle at build time, so changing them needs a new deploy.
- The welcome's demo link opens `/login?demo=1`. Once the stored session is known, the screen logs in with the demo credentials only when no session is open; with one open, the parameter is ignored and the visitor stays as they were. Either way the parameter is then removed from the URL, so a reload or the back button does not log in again.
- The submit button cannot be pressed twice.
- On success: store the token, go to `/play`.

### 5.3 Play `/play`

Layout at 390 × 844, top to bottom:

1. **Top bar** (48 px): streak on the left, round count in the middle, link to stats on the right.
2. **Chart** (about 55% of the height). Sealed state.
3. **Question.**
4. **Two buttons**, side by side, in the bottom thumb zone: pass on the left, buy on the right.

| Element | Text |
| --- | --- |
| Streak | `Racha: 3` |
| Round count | `Gráfica 17` |
| Stats link | `Estadísticas` |
| Question | `¿Comprarías esta acción?` |
| Left button | `Pasar` |
| Right button | `Comprar` |
| Key hints | `← Pasar · → Comprar` |

The top bar's numbers come from `GET /stats`, called when `/play` loads: the streak is `streak.current` and the round count is `rounds + 1`. After a decision the streak is taken from the decision response, and the count goes up by one with the next chart. A `/stats` answer is used only if no decision was sent after it was asked; a later one may or may not count that decision, so it is dropped. The round count is never shown blank or wrong: while it is unknown (no answer yet, a dropped answer, or a failed request) the label is not shown, and `/stats` is asked again when the next chart loads, or when a retry loads the same one. `/stats` covers decided rounds only, so none of this asks about the open round.

Button rules: identical size, weight, border and fill. At least 56 px tall with 12 px between them. No "primary" styling on either. Disabled the instant one is pressed.

Desktop: the same column, centred, maximum width 480 px. Keyboard: `←` pass, `→` buy, `Enter` or `Space` for next chart. Show the key hints only on devices with a fine pointer.

**After the decision** the same screen changes in place: the chart reveals (§6), the question and buttons are replaced by the reveal card, and focus moves to the next-chart button.

Reveal card content, in this order:

| Element | Text (example) |
| --- | --- |
| Identity | `NVDA · NVIDIA Corporation` |
| Sector and exchange, smaller | `Tecnología · NASDAQ` |
| Window shown | `12 mar 2018 → 12 mar 2019` |
| Horizon | `los 3 meses siguientes, hasta el 11 jun 2019` |
| Headline number, large | `▼ −12.4%` |
| The call | one line from the table below |
| Prices | `USD 61.20 → USD 53.61` |
| Price note, below the prices (muted) | `Precios ajustados por splits.` |
| (P1) Live line, when it arrives | `Hoy: USD 184.20 · ▲ +310.0% desde entonces` |
| (P1) Live line, unavailable (muted) | `El precio de hoy no está disponible en este momento (límite de la API).` |
| (P1) Live line, unavailable for another reason (muted) | `El precio de hoy no está disponible en este momento.` |
| Button | `Siguiente gráfica` |

(P1) While the live line loads, show a one-line placeholder of the same height. The live call is optional: it sends one request with no wait for a sleeping server and no `ServerWaking` (`api.ts`, `optional`), and gives up after 8 s. The limit note is used only when the API answers `reason: "limit"`; a timeout or any other failure gets the shorter note. The arrow and the percent come from `headline(sinceCutoff)`. The limit note takes two lines at 390 px, so the bottom panel reserves that room and the chart keeps its size.

Call lines:

| Decision | Outcome | Text |
| --- | --- | --- |
| Buy | up | `Compraste. Buena decisión.` |
| Buy | down | `Compraste. Bajó.` |
| Buy | flat | `Compraste. No cambió.` |
| Pass | down or flat | `Pasaste. Buena decisión.` |
| Pass | up | `Pasaste. Subió sin ti.` |

The outcome comes from the raw return, with the boundary of `isCorrect` (02): flat is a return of exactly zero. A rise too small to show, printed as `0.0%`, is still up: `Compraste. Buena decisión.` The headline's number, arrow, colour and accessible label come from one function, `headline` in `lib/reveal.ts`, which reads the sign of the number as shown: a return shown as `0.0%` has no arrow and is in `ink`, neither `up` nor `down`. The call line keeps the raw return.

Announce the headline and the call through an `aria-live="polite"` region.

### 5.4 Stats `/stats`

Top to bottom:

1. For the demo account (`user.isDemo`), a one-line banner. The client keeps only the token (§7), so this screen asks `GET /auth/me` together with `GET /stats` and shows the scoreboard when both have answered. If `/auth/me` fails, there is no banner and the scoreboard still shows.
2. **The verdict** (the `Verdict` component), in the largest type on the screen.
3. **Three figures** in a row.
4. **The coin**: a horizontal band from the coin's 5th to 95th percentile, a centre tick at 0, and a marker for the user's edge. Below it, the coin sentence.
5. **Secondary figures.**
6. (P1) **Last 20 rounds**: ticker, cutoff month, the call, the return, a right/wrong mark.
7. Small print, then the log-out link.

| Element | Text |
| --- | --- |
| Demo banner | `Cuenta demo. Sus primeras 40 gráficas las jugó una moneda.` |
| Three figures | `Tus selecciones` · `Comprar todo` · `Lo que dejaste pasar` |
| Coin heading | `Contra una moneda` |
| Hit rate | `Aciertos` |
| Streaks | `Racha actual` · `Mejor racha` |
| Charts played | `Gráficas jugadas`, with `19 compras · 23 pases` |
| (P1) List heading | `Últimas 20 rondas` |
| (P1) List, the call | `Compraste` / `Pasaste` |
| Small print | `Rendimientos por precio a 63 jornadas bursátiles (unos 3 meses). No incluyen dividendos, comisiones ni impuestos. Las acciones que aparecen siguen cotizando hoy, lo que favorece a "comprar todo".` |
| Log out | `Cerrar sesión` |
| Back to the game (work unit 6, author's text) | `Seguir jugando` |

**Verdict sentences.** Approved wording; do not rephrase. Bold marks the figures set in the monospace face.

| State | Text |
| --- | --- |
| `worse` or `coin`, negative edge | Tus selecciones rindieron **+2.1%** en promedio. Comprar todas las gráficas rindió **+3.4%**. Tu criterio te costó **1.3 puntos porcentuales** por compra. |
| `better` or `coin`, positive edge | Tus selecciones rindieron **+4.6%** en promedio. Comprar todas las gráficas rindió **+3.4%**. Tu criterio te sumó **1.2 puntos porcentuales** por compra. |
| edge rounds to 0.0 | Tus selecciones y comprar todas las gráficas rindieron lo mismo: **+3.4%** en promedio. Tu criterio no cambió el resultado. |
| `insufficient`, several left | Faltan **6 gráficas** para tu primer veredicto. |
| `insufficient`, one left | Falta **1 gráfica** para tu primer veredicto. |
| `bought_all` | Compraste todas las gráficas, así que tu resultado es el mismo que el de comprar todo. Prueba dejar pasar las que no te convenzan. |
| `bought_none` | Todavía no has comprado ninguna gráfica. Aún no hay nada que medir. |

The figures in these sentences (approved by the author in work unit 6): each percentage is rounded once, to one decimal, and the points are the difference of the two rounded percentages shown in the same sentence, so the sum checks on screen. When that difference is 0.0, the "no cambió el resultado" sentence applies. The verdict against the coin (`worse`, `better`, `coin`) uses the raw edge.

**Coin sentences.** Approved wording. All three start with the same sentence, then continue by verdict:

> Una moneda que compra al azar 19 de estas 42 gráficas queda entre −2.1 y +2.0 puntos nueve de cada diez veces.

| Verdict | Continuation |
| --- | --- |
| `coin` | Tu resultado está dentro de ese rango. Por ahora, tu criterio no se distingue de lanzar una moneda. |
| `better` | Tu resultado está por encima de ese rango. Por ahora, mejor que una moneda: superas al 96% de los lanzamientos. |
| `worse` | Tu resultado está por debajo de ese rango. Por ahora, peor que una moneda: la moneda te gana el 97% de las veces. |

Always include the counts ("19 de estas 42 gráficas"). In `better`, the percentage is the share of coin trials the user beat (`percentile`); in `worse`, it is the share that beat the user (`beatenBy`). A tie counts on neither side. The percentage shown never goes above 99%: with 2,000 simulated trials, 100% would claim more than the simulation can prove. If a number the coin section shows is missing from `/stats` or is not a number (for example, from a backend older than the frontend during a deploy), the section is left out: `NaN` never reaches the screen.

## 6. The chart

One component, hand-written SVG. About 315 points do not need a library, and no library offers a chart with the axes deliberately removed and a staged reveal.

**Props:** `points: number[]` (sealed), or `reveal: { history, future, cutoffDate, … }` (revealed).

**Sealed state**

- A single `ink` polyline, 2 px, `vector-effect: non-scaling-stroke`, round joins.
- The line occupies the left 80% of the width. The right 20% is an empty zone with a faint dashed boundary and a `?`. That empty space is the question, and it means nothing moves sideways at the reveal.
- No axes, no grid values, no dates, no tooltip, no hover or touch read-out. Three faint horizontal hairlines are allowed for shape reference; they carry no labels.
- `role="img"`, `aria-label="Gráfica de precios anónima, un año de precios diarios"`.

**Revealed state**, in sequence:

1. Recompute the vertical scale over history and future together and redraw the history line (a 200 ms cross-fade is enough; do not animate the path data).
2. Draw the future line into the right 20% over about 900 ms using `stroke-dashoffset`. Colour: `up` when the final close is above the cutoff close, else `down`.
3. Fade in labels: the three dates along the bottom (start, cutoff, end) and the two prices (at the cutoff, at the end). A dot marks the cutoff and the end point.
4. The label becomes `aria-label="Gráfica de NVDA, del 12 mar 2018 al 11 jun 2019"`.

Keep 4% padding top and bottom so the line never touches the edge. The chart must stay sharp from 320 px to 480 px wide.

## 7. Auth on the client

- Token in `localStorage` under one key, read once into the auth context on mount.
- `api.ts` adds `Authorization: Bearer <token>` to every request whose caller passes the token from the auth context: the protected calls. Register and log in send none.
- When the server answers `UNAUTHORIZED` to a request that carried a token, `api.ts` clears the token and loads `/login?expired=1`, which shows the session notice (§8). It checks the code, not the status, so `401 INVALID_CREDENTIALS` stays on the form.
- `/play` and `/stats` render nothing but a neutral skeleton until the token has been read, then redirect to `/login` if there is none, without the notice: with no token nothing was rejected, and the app cannot tell a lost session from a visitor who never logged in (`DECISIONS.md`). No flash of protected content.
- Trade-off for `DECISIONS.md` and the README: `localStorage` is readable by any script on the page. The alternative, an httpOnly cookie, needs frontend and backend on the same site, and they are on two different hosts here. The app renders no user-generated HTML and loads no third-party scripts, which keeps the exposure small. With more time: proxy the API through the Next.js host and switch to a cookie.

## 8. States that must exist

| Situation | Behaviour | Text |
| --- | --- | --- |
| First request while the backend is asleep | After 3 s without a response show `ServerWaking`. Poll `/status` (the health check, `02-backend.md` §7) every 3 s, then continue automatically. If it answers with `db: false`, stop waiting and show the generic error (the "Offline, 5xx" row). The rules of the wait are below the table. | Full screen: the logo, a line that keeps drawing itself, the title `Despertando el servidor`, `El servidor se duerme tras 15 minutos sin uso. La primera carga puede tardar cerca de un minuto. Entrarás en cuanto responda.`, a sliding bar (`Esperando al servidor`) and `Reintentando · N s`, the seconds since the screen appeared. |
| Loading a round | Chart-shaped skeleton; buttons visible and disabled. | — |
| Submitting a decision | Both buttons disabled at once; no double submit. On failure, re-enable. The round is still open server-side, so retrying is safe. | `No se pudo guardar tu respuesta. Intenta de nuevo.` |
| Open round resumed | Nothing special. The same chart appears. | — |
| `NO_DATA` (503) | Message with a retry button. | `Todavía no hay gráficas cargadas. La biblioteca de precios se está llenando.` · button `Reintentar` |
| (P1) Live price slow or unavailable | The reveal is complete without it; placeholder, then the price or the muted note (§5.3). | — |
| Offline, 5xx, or any unmapped error code | One-line error with a retry button. Never a blank screen. | `Algo salió mal. Intenta de nuevo.` · button `Reintentar` |
| Session expired | Back to `/login` with a notice. | `Tu sesión expiró. Inicia sesión de nuevo.` |
| Fewer than 10 rounds on Stats | The `insufficient` verdict and whatever secondary figures exist. | see §5.4 |

The wait for a sleeping server lives in `api.ts` alone, so it covers every call (log in, a round, a decision, the stats):

- **Not only `/status`.** The original request stays in flight while `/status` is asked; when it answers, the wait ends, even if `/status` never did. The result is delivered once.
- **A retry only when the server never got the request:** a network error, or a `502`, `503` or `504` whose body is not one of our API's errors. Any other answer is delivered as it is, `401`, `409`, `400` and our own `503 NO_DATA` included. The request is sent again once `/status` answers `db: true`. `/status` is asked one request at a time: Render holds a request while it wakes, so it answers late rather than never.
- **At most 90 s.** Then the call fails, and each screen shows its failure state: the generic error with `Reintentar` on `/play` and `/stats`, the generic error under the form on `/login`, and the decision's own message after a decision. The waiting screen never stays up without an end.
- **`ServerWaking`** is a full-screen screen over the page, in the root layout. A live region on the page from the start is filled with the title and the text when the wait begins, so screen readers announce them once; the visible copy and the counter are outside it, so the counter is not read every second. The counter counts from `wakingSince()` in `api.ts`, the moment the screen appeared.

## 9. Formatting

All in `format.ts`, all via `Intl` with the locale `es-MX`. This is formatting only: no currency conversion happens anywhere.

| Kind | Rule | Examples |
| --- | --- | --- |
| Percent | One decimal, sign shown on every value except zero (`signDisplay: "exceptZero"`), real minus sign `−` | `+2.1%`, `−12.4%`, `0.0%` |
| Points | Absolute value, one decimal; the verb (costó / sumó) carries the direction | `1.3 puntos porcentuales`, `1.3 puntos` |
| Range bounds | Signed, one decimal | `−2.1`, `+2.0` |
| Share | A whole percent, rounded down so a claim is never overstated; the coin's "superas al" and "te gana el" (at most `99%`), and the hit rate | `96%` |
| Money | Number with two decimals and `es-MX` grouping, prefixed with `USD` and a non-breaking space. Never a bare `$`. | `USD 184.20`, `USD 1,234.56` |
| Date, full | Day, short month, year | `12 mar 2019` |
| (P1) Date, list | Short month, year; used only by the last-20 list | `mar 2019` |

- `es-MX` uses a point for decimals and a comma for thousands.
- Build money as `"USD" + nbsp + number` instead of `style: "currency"`, so the output does not depend on how a runtime renders the currency code.
- API dates are `YYYY-MM-DD` with no time. Parse them as UTC and format with `timeZone: "UTC"`. Otherwise a browser in Mexico, which is behind UTC, shows the previous day.
- Replace the hyphen that `Intl` emits for negatives with the real minus sign.
- Never show a rounded value whose sign differs from the real one. An edge that rounds to `0.0` uses the "no cambió el resultado" sentence.
- Plurals are explicit in `copy.ts` (`Falta 1 gráfica` / `Faltan 6 gráficas`).

## 10. Accessibility and feel

- `<html lang="es-MX">`.
- Everything reachable and operable by keyboard; visible focus ring on `ink`.
- Text contrast at least 4.5:1 on `paper`; `up` and `down` as specified meet it.
- Touch targets at least 48 px; the two decision buttons at least 56 px.
- No layout shift between sealed and revealed: reserve the reveal card's height.
- `viewport` set so the game does not zoom on double-tap; text remains user-scalable.

Accessibility labels and titles, also from `copy.ts`:

| Where | Text |
| --- | --- |
| Sealed chart | `Gráfica de precios anónima, un año de precios diarios` |
| Revealed chart | `Gráfica de NVDA, del 12 mar 2018 al 11 jun 2019` |
| Coin band | `Rango de la moneda: de −2.1 a +2.0 puntos. Tu resultado: −1.3 puntos.` |
| (P1) Right / wrong mark in the list | `Acierto` / `Error` |
| Up / down arrow | `Subió` / `Bajó` |
| Page titles | `Guess-Up` · `Guess-Up · Iniciar sesión` · `Guess-Up · Jugar` · `Guess-Up · Estadísticas` |

## 11. Checks

- `pnpm typecheck`, `pnpm lint`, `pnpm build` clean.
- Unit tests for the pure functions in `lib/` only (`pnpm test`, Vitest): `format.ts`, asserting the exact strings in §9: signs, rounding, the zero case, `USD 1,234.56`, and `12 mar 2019` for the input `2019-03-12` with the process time zone set to `America/Mexico_City`; `verdict.ts`, the sentences of §5.4; `reveal.ts`, the call line and the headline arrow of §5.3; `chartNumber.ts`, the round count of §5.3; `demo.ts`, whether the demo link is rendered (§5.2). Components are checked by hand; there is no time budget for a browser test suite.
- Copy check before each deploy: search the frontend source for a bare `$` followed by a digit, for English interface text, and for voseo forms. All three searches come back empty.
- Manual pass before each deploy, at 390 px and at desktop width: sign up → play three rounds → stats → log out → demo account → stats. Then once with the backend stopped, to see every error state.

## 12. Deployment

- Vercel, root directory `frontend`. Environment variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_DEMO_EMAIL`, `NEXT_PUBLIC_DEMO_PASSWORD`.
- Locally the variables live in `frontend/.env.local` (git-ignored); `frontend/.env.example` lists the three names with no values.
- After the first deploy, add the Vercel production URL to the backend's `CORS_ORIGIN`, a comma-separated list (`02-backend.md` §8).

## 13. Not built

Dark mode, swipe gestures, sharing, sound and haptics, onboarding tutorial, installable PWA, a second interface language or a language switch, zoom or pan on the chart.

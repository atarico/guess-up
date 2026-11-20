# Session 07 — Work unit 7: the demo account

- **Date:** 2026-11-20, 14:29 to about 15:10 UTC, in the same Claude Code session as the fixes after unit 6 (`06-stats.md`, part 2).
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

### Prompt 4 — 15:04 UTC (two pasted blocks: the request, then the author's terminal output)

````text
Corri el seed: 59 ready, C fallo por error de red (lo reintento yo). El seed:check muestra que CVS tiene una vela el 2009-07-26, que es domingo, con un salto de +144% y -59%. Es un dato malo del proveedor.
1. Agrega al seed un control que descarte velas de sabado o domingo, con test, y anotalo en 02 seccion 5.2 y en DECISIONS.md.
2. Pasame el comando para volver a bajar CVS solo.
3. Revisa si alguna ronda guardada, la de la demo incluida, usa CVS con esa fecha dentro de su ventana. Si hay, decime si corro seed:demo --reset.
Tambien el arreglo del NaN que te pedi antes. Despues pusheo.
````

````text
➜ pnpm seed

> guess-up-backend@ seed /home/atarico/Escritorio/trabajos/ruut/guess-up/backend
> tsx --env-file=.env src/scripts/seed.ts

MSFT ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 2
NVDA ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 3
ORCL ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 4
CSCO ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 5
ADBE ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 6
MU ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 7
INTC ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 8
GOOGL ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 9
META ready: 3648 bars, 2012-05-18 → 2026-11-19, credits used today: 10
NFLX ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 11
DIS ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 12
VZ ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 13
AMZN ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 14
TSLA ready: 4125 bars, 2010-06-29 → 2026-11-19, credits used today: 15
HD ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 16
MCD ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 17
NKE ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 18
F ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 19
M ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 20
PG ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 21
KO ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 22
WMT ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 23
COST ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 24
CPB ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 25
JNJ ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 26
MRK ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 27
UNH ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 28
PFE ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 29
BIIB ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 30
CVS ready: 4999 bars, 2007-01-10 → 2026-11-19, credits used today: 31
JPM ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 32
BAC ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 33
GS ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 34
V ready: 4699 bars, 2008-03-19 → 2026-11-19, credits used today: 35
C failed: Twelve Data time_series for C: network error
AIG ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 37
CAT ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 38
DE ready: 4999 bars, 2007-01-10 → 2026-11-19, credits used today: 39
UNP ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 40
BA ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 41
UPS ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 42
AAL ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 43
XOM ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 44
CVX ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 45
EOG ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 46
SLB ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 47
APA ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 48
NEE ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 49
DUK ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 50
SO ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 51
PCG ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 52
SHW ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 53
APD ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 54
NUE ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 55
MOS ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 56
PLD ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 57
AMT ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 58
O ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 59
MAC ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 60
Done: 58 stored, 1 failed (C), 1 already ready. Credits used today: 60.

atarico in guess-up/backend [ Express v5.3.0][ pnpm]
➜ pnpm seed:check

> guess-up-backend@ seed:check /home/atarico/Escritorio/trabajos/ruut/guess-up/backend
> tsx --env-file=.env src/scripts/seedCheck.ts

Symbols by status
┌─────────┬──────────┬─────────┐
│ (index) │ status   │ symbols │
├─────────┼──────────┼─────────┤
│ 0       │ 'failed' │ 1       │
│ 1       │ 'ready'  │ 59      │
└─────────┴──────────┴─────────┘
Bars per symbol
┌─────────┬─────────┬──────────┬──────┬──────────────┬──────────────┐
│ (index) │ symbol  │ status   │ bars │ first_day    │ last_day     │
├─────────┼─────────┼──────────┼──────┼──────────────┼──────────────┤
│ 0       │ 'C'     │ 'failed' │ 0    │ null         │ null         │
│ 1       │ 'AAL'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 2       │ 'AAPL'  │ 'ready'  │ 4999 │ '2007-01-08' │ '2026-11-18' │
│ 3       │ 'ADBE'  │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 4       │ 'AIG'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 5       │ 'AMT'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 6       │ 'AMZN'  │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 7       │ 'APA'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 8       │ 'APD'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 9       │ 'BA'    │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 10      │ 'BAC'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 11      │ 'BIIB'  │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 12      │ 'CAT'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 13      │ 'COST'  │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 14      │ 'CPB'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 15      │ 'CSCO'  │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 16      │ 'CVS'   │ 'ready'  │ 4999 │ '2007-01-10' │ '2026-11-19' │
│ 17      │ 'CVX'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 18      │ 'DE'    │ 'ready'  │ 4999 │ '2007-01-10' │ '2026-11-19' │
│ 19      │ 'DIS'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 20      │ 'DUK'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 21      │ 'EOG'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 22      │ 'F'     │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 23      │ 'GOOGL' │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 24      │ 'GS'    │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 25      │ 'HD'    │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 26      │ 'INTC'  │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 27      │ 'JNJ'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 28      │ 'JPM'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 29      │ 'KO'    │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 30      │ 'M'     │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 31      │ 'MAC'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 32      │ 'MCD'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 33      │ 'META'  │ 'ready'  │ 3648 │ '2012-05-18' │ '2026-11-19' │
│ 34      │ 'MOS'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 35      │ 'MRK'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 36      │ 'MSFT'  │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 37      │ 'MU'    │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 38      │ 'NEE'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 39      │ 'NFLX'  │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 40      │ 'NKE'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 41      │ 'NUE'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 42      │ 'NVDA'  │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 43      │ 'O'     │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 44      │ 'ORCL'  │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 45      │ 'PCG'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 46      │ 'PFE'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 47      │ 'PG'    │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 48      │ 'PLD'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 49      │ 'SHW'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 50      │ 'SLB'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 51      │ 'SO'    │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 52      │ 'TSLA'  │ 'ready'  │ 4125 │ '2010-06-29' │ '2026-11-19' │
│ 53      │ 'UNH'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 54      │ 'UNP'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 55      │ 'UPS'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 56      │ 'V'     │ 'ready'  │ 4699 │ '2008-03-19' │ '2026-11-19' │
│ 57      │ 'VZ'    │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 58      │ 'WMT'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
│ 59      │ 'XOM'   │ 'ready'  │ 4999 │ '2007-01-09' │ '2026-11-19' │
└─────────┴─────────┴──────────┴──────┴──────────────┴──────────────┘
Day-to-day moves above 40%: 16
┌─────────┬────────┬──────────────┬──────────────┬────────────────┬──────────────┬────────────┐
│ (index) │ symbol │ previous_day │ day          │ previous_close │ close        │ change_pct │
├─────────┼────────┼──────────────┼──────────────┼────────────────┼──────────────┼────────────┤
│ 0       │ 'AAL'  │ '2008-07-21' │ '2008-07-22' │ '2.690000'     │ '4.270000'   │ '58.7'     │
│ 1       │ 'AAL'  │ '2020-06-03' │ '2020-06-04' │ '11.850000'    │ '16.720000'  │ '41.1'     │
│ 2       │ 'AIG'  │ '2008-09-12' │ '2008-09-15' │ '242.800000'   │ '95.200000'  │ '-60.8'    │
│ 3       │ 'AIG'  │ '2008-09-16' │ '2008-09-17' │ '75.000000'    │ '41.000000'  │ '-45.3'    │
│ 4       │ 'AIG'  │ '2008-09-18' │ '2008-09-19' │ '53.800000'    │ '77.000000'  │ '43.1'     │
│ 5       │ 'AIG'  │ '2009-03-13' │ '2009-03-16' │ '10.000000'    │ '16.600000'  │ '66.0'     │
│ 6       │ 'AIG'  │ '2009-03-17' │ '2009-03-18' │ '19.200000'    │ '27.600000'  │ '43.8'     │
│ 7       │ 'AIG'  │ '2009-08-04' │ '2009-08-05' │ '13.520000'    │ '22.000000'  │ '62.7'     │
│ 8       │ 'APA'  │ '2020-03-06' │ '2020-03-09' │ '20.700000'    │ '9.550000'   │ '-53.9'    │
│ 9       │ 'BIIB' │ '2020-11-03' │ '2020-11-04' │ '247.009995'   │ '355.630000' │ '44.0'     │
│ 10      │ 'CVS'  │ '2009-07-24' │ '2009-07-26' │ '34.380000'    │ '84.089996'  │ '144.6'    │
│ 11      │ 'CVS'  │ '2009-07-26' │ '2009-07-27' │ '84.089996'    │ '34.049999'  │ '-59.5'    │
│ 12      │ 'MOS'  │ '2008-10-01' │ '2008-10-02' │ '67.510000'    │ '39.650000'  │ '-41.3'    │
│ 13      │ 'NFLX' │ '2013-01-23' │ '2013-01-24' │ '1.475140'     │ '2.098000'   │ '42.2'     │
│ 14      │ 'PCG'  │ '2019-01-11' │ '2019-01-14' │ '17.590000'    │ '8.380000'   │ '-52.4'    │
│ 15      │ 'PCG'  │ '2019-01-23' │ '2019-01-24' │ '7.990000'     │ '13.950000'  │ '74.6'     │
└─────────┴────────┴──────────────┴──────────────┴────────────────┴──────────────┴────────────┘

atarico in guess-up/backend [ Express v5.3.0][ pnpm]
➜ pnpm seed:demo

> guess-up-backend@ seed:demo /home/atarico/Escritorio/trabajos/ruut/guess-up/backend
> tsx --env-file=.env src/scripts/seedDemo.ts

Demo user demo@test.com: created. Added 40 decided rounds; 40 in all.
Verdict on Stats: coin (40 rounds, 20 bought; edge +2.1 points, coin range -3.4 to +3.4).

atarico in guess-up/backend on  main [⇡?] [ Express v5.3.0][ pnpm]
➜ pnpm seed

> guess-up-backend@ seed /home/atarico/Escritorio/trabajos/ruut/guess-up/backend
> tsx --env-file=.env src/scripts/seed.ts

C ready: 4999 bars, 2007-01-09 → 2026-11-19, credits used today: 61
Done: 1 stored, 0 failed, 59 already ready. Credits used today: 61.

````

**Outcome:**
- **Read-only check against production first:** CVS 2009-07-26 is the only Saturday or Sunday bar in `daily_closes`, and no stored round has a weekend bar in its window. The only rounds are the demo's 40, none on CVS: `seed:demo --reset` is not needed.
- **Weekend control, test-first in the domain:** the fixtures moved to weekdays first (all green), then RED 4 of 4 against a stub `isWeekend`, then GREEN. `prepareSeries` discards Saturday and Sunday bars before any other check; the seed's log line names them. 02 §5.2, §5.5 and `DECISIONS.md` updated.
- **The command for CVS:** `--only` skips a `ready` symbol, like a full run, so `pnpm seed --only CVS` alone would fetch nothing. The AI gave the author two steps: set CVS to `pending` with one SQL statement, then `pnpm seed --only CVS`.
- **The NaN fix** the prompt mentions was already in `2dc2a23` (Prompt 3).

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
- **The unit 7 author steps did not say that `--only` skips a `ready` symbol;** it came up only when the author needed to fetch CVS again (Prompt 4). 02 §5.5 now says it.
- **The read-only check script first failed to start** (top-level `await` in a file run as CommonJS); renamed to `.mts`, it ran inside a read-only transaction.
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
- `142f6ea` docs(prompts): log the NaN fix in session 07
- `25867a0` fix(seed): discard Saturday and Sunday bars on ingest

This update of the log is one more commit, made afterwards.

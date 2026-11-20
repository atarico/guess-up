# Session 02 — Work unit 2: market data

- **Date:** 2026-11-20, 09:07 to about 09:40 UTC, in the same Claude Code session as sessions 00 and 01.
- **Tool:** Claude Code 2.1.329, with the Gentle AI ODD rules and Engram memory. No sub-agents and no MCP servers in this unit.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`).
- **Plan and logbook:** `odd/tasks/02-market-data.md`: specs S1–S10 quoting the author, assumptions A1–A10, tasks T1–T11, the full-seed steps, log L1–L5.
- **Twelve Data credits:** 1, for `pnpm seed --only AAPL` (T8). 02 §5.1 was not checked again; every test uses the fake provider or an injected `fetch`.
- **Secrets:** the API key travels only in the `Authorization` header. The seed's output was checked for it before being shown, without printing it. No key, password or database URL is in this file.

## Prompts

The author's prompts are copied exactly as sent, extracted from the Claude Code transcript rather than retyped. The short outcome after each prompt is not part of it.

### Prompt 1 — 09:07 UTC (pasted text)

````text
Unidad 2 de la sección 15 de 01-product.md: datos de mercado. La especificación está en 02-backend.md, secciones 5.1 a 5.5. Lo marcado (P1) no entra.

Qué tiene que quedar funcionando
- El cliente de Twelve Data detrás de la interfaz MarketDataProvider, con fetchDailyCloses, los errores tipados y el timeout de 5.4. Y el proveedor falso que usan los tests.
- El presupuesto de créditos de 5.3, con el reloj inyectado.
- La escritura de una serie como snapshot según 5.2, con sus reglas de rechazo.
- universe.ts con la lista que aprobé. Usala tal cual: si no la encontrás escrita en el repo o en Engram, frená y pedímela. No la rearmes de memoria.
- El script de seed de 5.5, idempotente y reanudable.
- Aparte, como tarea y commit propios: la línea de log por pedido de 02 §8 que quedó pendiente de la unidad 1. Método, ruta sin query string, status y milisegundos. Nada de headers ni cuerpos.

Qué no entra
fetchQuote, liveQuoteService, --max-age-days, autenticación y rondas.

Twelve Data real
- Los tests usan el proveedor falso y no tocan la red ni la base.
- La sección 5.1 ya está verificada con llamadas reales. No la vuelvas a comprobar gastando créditos.
- Para probar el cliente real de punta a punta podés correr el seed de un solo símbolo: 1 crédito, cuando los tests estén en verde. Si hace falta un flag para eso (por ejemplo --only <símbolo>), agregalo y anotalo en 5.5.
- El seed completo lo corro yo: pasame el comando, cuánto tarda y cuántos créditos gasta.
- La key va por header y nunca aparece en logs, errores ni salidas.

Cómo quiero que corra ODD
- Documento en odd/tasks/02-market-data.md antes de escribir código. Frená ahí, pasame el resumen en no más de 15 líneas y esperá mi ok.
- TDD, con rojo observado antes del verde, para el presupuesto de créditos y para la validación de la serie. El resto, con tests normales.
- Directo sobre main, un commit por tarea. El push lo hago yo.
- Hacé la evaluación de RDD en cada commit, como pide el protocolo, no al final.
- Si una respuesta real contradice 5.1, frená y mostrámela. No ajustes el código para que pase.

Al cerrar
- Un comando de verificación post-seed, de solo lectura: símbolos ready y failed, cantidad de velas y rango de fechas por símbolo, y los saltos de más de 40% de un día al otro.
- La sección Commands de CLAUDE.md actualizada, con la copia de prompts/system sincronizada.
- La sesión registrada en prompts/sessions/02-market-data.md.
````

**Outcome:** the AI looked for the approved universe in the repo and in Engram, as the prompt allowed, and found only its size and the KHC → CPB change, not the table. It wrote `odd/tasks/02-market-data.md` before any code, with T6 blocked, and stopped with a 15-line summary. It asked for either the list or permission to copy it from the session 00 transcript.

### Prompt 2 — 09:14 UTC

````text
Ok al plan y a los supuestos A1 a A10.
Copia la tabla de acciones textual de la sesion 00, con KHC reemplazada por CPB. Ya la aprobe ahi, no me la vuelvas a mostrar.
Segui sin frenar hasta el final de la unidad, salvo que algo cambie significativamente, la spec o gaste creditos de mas.
````

**Outcome:** the table was extracted by script from the session 00 transcript and not shown again: 60 rows, 20 marked as having done badly. The CPB row takes its name from the Twelve Data catalogue saved in session 00. Then T1–T11 ran in order, one commit each, with an RDD assessment after every commit.
- **TDD with RED observed:** the credit budget (6 failed against a stub) and the series check (6 of 7 failed against a pass-through stub).
- **The one real call:** `pnpm seed --only AAPL` stored 4,999 bars, 2007-01-08 → 2026-11-18, exchange NASDAQ, for 1 credit. It matched 02 §5.1.

## What the AI got wrong / what was fixed by hand

- **One RDD assessment was not read.** The assessment after `e2179c3` returned output the AI's small parser could not read ("Extra data"). The next assessment, which covers the same range from `83757d7` and so includes `e2179c3`, was `medium`, not due. The parser was changed to read several JSON objects; a raw re-run then showed a single object.
- **A confusing sentence.** One sentence of the full-seed steps came out garbled (the list of symbols with shorter histories). It was rewritten before the commit.
- **What is not covered by tests.** The SQL of the repositories (`replaceSeries`, `upsertUniverse`, `statusOf`, `markFailed`, the daily counter) and `seed:check` have no unit tests, because tests may not touch a database. They were exercised against Supabase by the one-credit run (T8) and by `seed:check`.
- **A counter gap.** `api_usage` counts this project's calls from now on. The 13 credits of session 00 are not in it. The 750-of-800 cap leaves room for them.
- **Nothing was fixed by hand in this unit.** The author approved the plan and the assumptions, and authorized copying the universe from the session 00 transcript. The full seed is left for the author to run.

## Resulting commits

On `main`, not pushed when this was written (`origin/main` at `b846309`); the author pushes:

- `2e645c4` feat(backend): log one line per request
- `e080baa` feat(backend): add the market data provider interface and fake provider
- `355409e` feat(backend): add the credit budget
- `ae2c1d1` feat(backend): add the Twelve Data client
- `32cf39e` feat(backend): validate a provider series and store it as a snapshot
- `1011e68` feat(backend): add the approved stock universe
- `7fc3d8f` feat(backend): add the seed script
- `e2179c3` docs(odd): record the one-credit end-to-end seed
- `c761aac` feat(backend): add the read-only post-seed check
- `33d6016` docs: add the seed commands to CLAUDE.md

This log is one more commit, made afterwards.

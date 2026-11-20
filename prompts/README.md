# How this was built with AI

Every prompt sent to the coding agent is in `sessions/`, in order and verbatim, with what the AI got wrong. The specs that guided it are in `specs/`, and the project rules it read are in `system/`.

## Tools

| Tool | Version, as recorded in the session logs | Used for |
| --- | --- | --- |
| Claude Code | 2.1.328 for the first part of session 00; 2.1.329 from then on | Every coding session |
| Model | Claude Opus 5.5 (`claude-opus-5-5`) as the main agent, at `xhigh` effort as the author set it in `~/.claude/settings.json` (the file also holds `high` entries; the session logs do not record the effort) | Everything in `sessions/` |
| Sub-agents | `web-fetch` on Sonnet to read documentation (sessions 00, 01); an independent verifier on Opus with a fresh context (units 1 and 3); one implementation writer on Sonnet for the live price (unit 9) | As listed |
| Gentle AI | 4.6.0, with ODD (a plan and logbook per unit in `odd/tasks/`) and RDD (`gentle-ai review`: a risk assessment after each commit, and a multi-lens review when one is due) | Workflow and reviews |
| Claude (Fable 5.2) on claude.ai | — | The author drafted the specs and `CLAUDE.md` there from the author's own idea, and reviewed each unit's prompt there before sending it |

MCP servers and plugins, as the logs record them:

| Server | Used | Where |
| --- | --- | --- |
| Engram | Yes: memory across sessions and compactions | Every session |
| Playwright | Yes: browser checks at 390 px | Sessions 01, 03 and 06 (part 2). From session 05 on, most checks ran with `playwright-core` from scratch scripts instead, because the MCP writes a folder into the repository |
| Supabase | Yes, read-only checks, after the author authorized them | Session 01 |
| Context7 | Yes: library documentation | Sessions 03 (express-rate-limit, Zod, Next.js) and 07 (Next.js environment variables) |
| Vercel | Configured, not used | Session 03 says so |
| CodeGraph | Available, not used | — |

## How the work went

1. **Idea to spec.** The author wrote the idea and drafted `specs/01-product.md`, `02-backend.md`, `03-frontend.md` and `CLAUDE.md` with Claude on claude.ai.
2. **Spec review.** Session 00 reviewed the specs against real Twelve Data calls before any code; its outcomes are the numbered entries at the top of `DECISIONS.md`, which continue the open decisions of `specs/01-product.md` §14.
3. **One session per work unit,** in the build order of `specs/01-product.md` §15. Each unit's prompt was reviewed on claude.ai first. Each unit has a feature document in `odd/tasks/NN-*.md`: the author's request quoted verbatim as numbered specs, the tasks with their evidence, and a log of corrections and decisions. One commit per task. The domain (`backend/src/domain/`) was written test-first, with the failing test observed before the code.
4. **Reviews.** After every commit, `gentle-ai review assess` rated the risk; when a review was due, or the AI raised the risk, the author was asked for consent and a review ran with the lenses that fit the change. Blocking findings were fixed in their own commit; the rest went to `DECISIONS.md` as pending, with a proposed fix. Units 1 and 3 also had an independent verifier; later briefs ruled it out.
5. **Checks against production.** Both skeletons were deployed in unit 1, before any feature. Later units were checked live where they could be: the health check, the proxy hops measured on Render (unit 3), the seed and `seed:check` run by the author, read-only database queries, and a phone checklist for the author at the end of each UI unit.

## Sessions

Each log has the prompts, verbatim and in order, then a section **"What the AI got wrong / what was fixed by hand"**, then the resulting commits.

| Log | What was done | What the AI got wrong |
| --- | --- | --- |
| **TODO(author): the claude.ai conversation, exported by the author** | The idea, the specs and `CLAUDE.md`, and the review of each unit's prompt | — |
| [`00-spec-review.md`](sessions/00-spec-review.md) | Spec review; Twelve Data checked against real calls | [section](sessions/00-spec-review.md#what-the-ai-got-wrong--what-was-fixed-by-hand) |
| [`01-setup.md`](sessions/01-setup.md) | Both packages scaffolded, the schema, the health check, both deploys; the verifier's fixes | [section](sessions/01-setup.md#what-the-ai-got-wrong--what-was-fixed-by-hand) |
| [`02-market-data.md`](sessions/02-market-data.md) | The Twelve Data client, the credit budget, `seed` and `seed:check` | [section](sessions/02-market-data.md#what-the-ai-got-wrong--what-was-fixed-by-hand) |
| [`03-auth.md`](sessions/03-auth.md) | Register, login, JWT; the welcome and log-in screens; the rate limit and the proxy hops measured on Render; the verifier | [section](sessions/03-auth.md#what-the-ai-got-wrong--what-was-fixed-by-hand) |
| [`04-rounds.md`](sessions/04-rounds.md) | The game's domain, test-first; the rounds API with the no-leak contract test | [section](sessions/04-rounds.md#what-the-ai-got-wrong--what-was-fixed-by-hand) |
| [`05-play.md`](sessions/05-play.md) | The play screen, the chart and the reveal | [section](sessions/05-play.md#what-the-ai-got-wrong--what-was-fixed-by-hand) |
| [`06-stats.md`](sessions/06-stats.md) | Stats, the coin and their screen; part 2: three fixes (a buy at a zero return, coin ties, the chart number) | [part 1](sessions/06-stats.md#what-the-ai-got-wrong--what-was-fixed-by-hand), [part 2](sessions/06-stats.md#what-the-ai-got-wrong--what-was-fixed-by-hand-1) |
| [`07-demo.md`](sessions/07-demo.md) | The demo account; the `NaN` guard; weekend bars after the full seed | [section](sessions/07-demo.md#what-the-ai-got-wrong--what-was-fixed-by-hand) |
| [`08-cold-start.md`](sessions/08-cold-start.md) | The wait for a sleeping server and its screen | [section](sessions/08-cold-start.md#what-the-ai-got-wrong--what-was-fixed-by-hand) |
| [`09-polish.md`](sessions/09-polish.md) | Two fixes, this README and the project README, the closing checks, the live price | [section](sessions/09-polish.md#what-the-ai-got-wrong--what-was-fixed-by-hand) |
| [`10-app-style.md`](sessions/10-app-style.md) | The list of pending items; then the author's design canvas on the `app-style` branch: dark theme, the design's copy, the coin histogram and the last 20 charts | [section](sessions/10-app-style.md#what-the-ai-got-wrong--what-was-fixed-by-hand) |

## After the submission

The submitted version is tagged `submission` (`f1ba936`, the merge of PR #1). Work after it goes on branches from `fixes`, each with a PR against `fixes`, and is logged here.

| Log | What was done | What the AI got wrong |
| --- | --- | --- |
| [`11-onboarding.md`](sessions/11-onboarding.md) | An audit of the screens against 03 §5 and §6, with the origin of each difference; 03 brought up to the code; orientation for a first-time player: the stats link as text, the streak's meaning, the countdown to the first verdict, a short card the first time, the `?` zone back in the sealed chart, room for the chart on very short phones; PR #2. Then the README draft, checked against the code | [section](sessions/11-onboarding.md#what-the-ai-got-wrong--what-was-fixed-by-hand) |

## Folders

```
README.md     this file
system/       CLAUDE.md, identical to the one at the repository root
specs/        01-product.md, 02-backend.md, 03-frontend.md
sessions/     NN-topic.md, one per session, prompts verbatim
```

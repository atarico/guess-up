import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { isCorrect } from '../src/domain/stats.js';
import { FAKE_STOCKS, fakeDeps, inMemoryMarket, inMemoryRounds, TEST_JWT_SECRET } from './fakeDeps.js';

const tokenFor = (userId: string) => `Bearer ${jwt.sign({}, TEST_JWT_SECRET, { algorithm: 'HS256', subject: userId })}`;
const ANA = randomUUID();
const BEA = randomUUID();

const SECRETS = FAKE_STOCKS.flatMap((stock) => [stock.symbol, stock.name]);
const ISO_DATE = /\d{4}-\d{2}-\d{2}/;
function expectNoLeak(text: string) {
  for (const secret of SECRETS) expect(text).not.toContain(secret);
  expect(text).not.toMatch(ISO_DATE);
}

/** An app whose first round for anyone is ZZQX at its earliest cutoff (random always 0). */
function setup() {
  const market = inMemoryMarket();
  const rounds = inMemoryRounds();
  const app = createApp(fakeDeps({ ...market, rounds, random: () => 0 }));
  const open = async (userId = ANA) => (await request(app).post('/rounds').set('Authorization', tokenFor(userId))).body.round.id as string;
  const decide = (id: string, body: unknown, userId = ANA) =>
    request(app).post(`/rounds/${id}/decision`).set('Authorization', tokenFor(userId)).send(body as object);
  return { app, market, rounds, open, decide };
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /rounds/:id/decision', () => {
  it('answers 401 without a token', async () => {
    const { app, open } = setup();
    const id = await open();
    expect((await request(app).post(`/rounds/${id}/decision`).send({ decision: 'buy' })).status).toBe(401);
  });

  it('records the decision and reveals the round, built from the stored data', async () => {
    const { market, rounds, open, decide } = setup();
    const id = await open();
    const res = await decide(id, { decision: 'buy' });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['reveal', 'streak']);
    const bars = market.data.get('ZZQX')!;
    const stored = rounds.rows.get(id)!;
    expect(stored.decision).toBe('buy');
    expect(res.body.reveal).toEqual({
      symbol: 'ZZQX',
      name: 'Quuxcorp Industries',
      sector: 'Technology',
      exchange: 'NASDAQ',
      startDate: bars[0].d,
      cutoffDate: bars[251].d,
      endDate: bars[314].d,
      history: bars.slice(0, 252).map((bar) => ({ d: bar.d, c: bar.close })),
      future: bars.slice(252, 315).map((bar) => ({ d: bar.d, c: bar.close })),
      forwardReturn: stored.forwardReturn,
      decision: 'buy',
      correct: isCorrect('buy', stored.forwardReturn),
    });
    const right = isCorrect('buy', stored.forwardReturn);
    expect(res.body.streak).toEqual({ current: right ? 1 : 0, best: right ? 1 : 0 });
  });

  it('a second decision does not change the first: it gets the same reveal with the stored decision', async () => {
    const { rounds, open, decide } = setup();
    const id = await open();
    const first = await decide(id, { decision: 'buy' });
    const second = await decide(id, { decision: 'pass' });

    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
    expect(second.body.reveal.decision).toBe('buy');
    expect(rounds.rows.get(id)!.decision).toBe('buy');
  });

  it.each([
    ['an unknown decision', { decision: 'hold' }],
    ['no decision', {}],
    ['a decision of the wrong type', { decision: 1 }],
  ])('answers 400 VALIDATION for %s, with no reveal, and the round stays open', async (_case, body) => {
    const { rounds, open, decide } = setup();
    const id = await open();
    const res = await decide(id, body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
    expect(res.body.reveal).toBeUndefined();
    expectNoLeak(res.text);
    expect(rounds.rows.get(id)!.decision).toBeNull();
    // Still decidable afterwards.
    expect((await decide(id, { decision: 'pass' })).body.reveal.decision).toBe('pass');
  });

  it('answers the same 404 for someone else\'s round, an unknown id and an id that is not a UUID', async () => {
    const { rounds, open, decide } = setup();
    const anasRound = await open(ANA);

    const foreign = await decide(anasRound, { decision: 'buy' }, BEA);
    const unknown = await decide(randomUUID(), { decision: 'buy' }, BEA);
    const malformed = await decide('not-a-uuid', { decision: 'buy' }, BEA);

    for (const res of [foreign, unknown, malformed]) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Round not found' } });
      expectNoLeak(res.text);
    }
    expect(rounds.rows.get(anasRound)!.decision).toBeNull();
  });

  it('returns the streak of consecutive right calls, current and best', async () => {
    const { open, decide } = setup();
    // Every round here is the same chart (random 0), so its return decides which call is right.
    const firstId = await open();
    const first = await decide(firstId, { decision: 'buy' });
    const r = first.body.reveal.forwardReturn as number;
    const right = isCorrect('buy', r) ? 'buy' : 'pass';
    const wrong = right === 'buy' ? 'pass' : 'buy';
    const opening = first.body.reveal.correct ? 1 : 0;

    const after = async (decision: string) => (await decide(await open(), { decision })).body.streak;
    expect(await after(right)).toEqual({ current: opening + 1, best: opening + 1 });
    expect(await after(wrong)).toEqual({ current: 0, best: opening + 1 });
    expect(await after(right)).toEqual({ current: 1, best: opening + 1 });
  });
});

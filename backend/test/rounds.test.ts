import { inspect } from 'node:util';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { normalise } from '../src/domain/normalise.js';
import { FAKE_STOCKS, fakeDeps, inMemoryMarket, inMemoryRounds, TEST_JWT_SECRET } from './fakeDeps.js';

const tokenFor = (userId: string) => `Bearer ${jwt.sign({}, TEST_JWT_SECRET, { algorithm: 'HS256', subject: userId })}`;
const ANA = randomUUID();
const BEA = randomUUID();

// What must never reach a client, a header or a log before the decision (invariant 1).
const SECRETS = FAKE_STOCKS.flatMap((stock) => [stock.symbol, stock.name]);
const ISO_DATE = /\d{4}-\d{2}-\d{2}/;

function expectNoLeak(text: string) {
  for (const secret of SECRETS) expect(text).not.toContain(secret);
  expect(text).not.toMatch(ISO_DATE);
}

/** The no-leak contract of 02 §9 for one answer of POST /rounds. */
function expectSealedRound(res: request.Response, resumed: boolean) {
  expect(res.status).toBe(200);
  expect(Object.keys(res.body).sort()).toEqual(['resumed', 'round']);
  expect(Object.keys(res.body.round).sort()).toEqual(['id', 'points']);
  expect(res.body.resumed).toBe(resumed);
  expect(res.body.round.points).toHaveLength(252);
  expect(res.body.round.points.every((p: unknown) => typeof p === 'number' && p >= 0 && p <= 1)).toBe(true);
  expectNoLeak(res.text);
  expectNoLeak(JSON.stringify(res.headers));
}

let lines: string[] = [];
const logs = () => lines.join('\n');

beforeEach(() => {
  lines = [];
  for (const method of ['log', 'info', 'warn', 'error'] as const) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      lines.push(args.map((a) => (typeof a === 'string' ? a : inspect(a, { depth: 5 }))).join(' '));
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /rounds', () => {
  it('answers 401 without a token', async () => {
    const res = await request(createApp(fakeDeps())).post('/rounds');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('a new round carries only the id, 252 points in [0, 1] and resumed: false (no-leak contract)', async () => {
    const res = await request(createApp(fakeDeps())).post('/rounds').set('Authorization', tokenFor(ANA));
    expectSealedRound(res, false);
    expectNoLeak(logs());
  });

  it('a resumed round has the same id and the same points, and passes the same check', async () => {
    const app = createApp(fakeDeps());
    const first = await request(app).post('/rounds').set('Authorization', tokenFor(ANA));
    const again = await request(app).post('/rounds').set('Authorization', tokenFor(ANA));
    expectSealedRound(again, true);
    expect(again.body.round.id).toBe(first.body.round.id);
    expect(again.body.round.points).toEqual(first.body.round.points);
    expectNoLeak(logs());
  });

  it('stores the cutoff and freezes the forward return when the round is created', async () => {
    const market = inMemoryMarket();
    const rounds = inMemoryRounds();
    const app = createApp(fakeDeps({ ...market, rounds, random: () => 0 }));
    const res = await request(app).post('/rounds').set('Authorization', tokenFor(ANA));

    const bars = market.data.get('ZZQX')!;
    const [row] = [...rounds.rows.values()];
    expect(row).toMatchObject({ userId: ANA, symbol: 'ZZQX', cutoffDate: bars[251].d, decision: null });
    expect(row.forwardReturn).toBeCloseTo(bars[314].close / bars[251].close - 1, 6);
    expect(res.body.round.points).toEqual(normalise(bars.slice(0, 252).map((bar) => bar.close)));
  });

  it('picks the stock first and then the cutoff', async () => {
    const rounds = inMemoryRounds();
    const draws = [0.7, 0];
    const app = createApp(fakeDeps({ rounds, random: () => draws.shift() ?? 0 }));
    await request(app).post('/rounds').set('Authorization', tokenFor(ANA));
    // 0.7 of three ready stocks is the third one; 0 is the earliest cutoff.
    expect([...rounds.rows.values()][0].symbol).toBe('XXRT');
  });

  it('resuming reads the 252 closes of the window, never the whole history', async () => {
    const market = inMemoryMarket();
    const app = createApp(fakeDeps({ ...market }));
    await request(app).post('/rounds').set('Authorization', tokenFor(ANA));
    expect(market.calls).toEqual({ series: 1, upTo: 0 });
    await request(app).post('/rounds').set('Authorization', tokenFor(ANA));
    await request(app).post('/rounds').set('Authorization', tokenFor(ANA));
    expect(market.calls).toEqual({ series: 1, upTo: 2 });
  });

  it('two requests at once leave one open round, and both answers carry it', async () => {
    const base = inMemoryRounds();
    // Hold the first two lookups until both have arrived, so both requests see no open round and
    // both try to insert: the case the partial unique index exists for.
    const held: (() => void)[] = [];
    let lookups = 0;
    const rounds = {
      ...base,
      async findOpen(userId: string) {
        if (++lookups <= 2) {
          await new Promise<void>((resolve) => {
            held.push(resolve);
            if (held.length === 2) held.forEach((release) => release());
          });
        }
        return base.findOpen(userId);
      },
    };
    const app = createApp(fakeDeps({ rounds }));
    const [a, b] = await Promise.all([
      request(app).post('/rounds').set('Authorization', tokenFor(ANA)),
      request(app).post('/rounds').set('Authorization', tokenFor(ANA)),
    ]);

    expect([a.body.resumed, b.body.resumed].sort()).toEqual([false, true]);
    expectSealedRound(a, a.body.resumed);
    expectSealedRound(b, b.body.resumed);
    expect(a.body.round.id).toBe(b.body.round.id);
    expect(a.body.round.points).toEqual(b.body.round.points);
    expect([...base.rows.values()].filter((row) => row.userId === ANA && row.decision === null)).toHaveLength(1);
    expectNoLeak(logs());
  });

  it('gives each user their own round', async () => {
    const app = createApp(fakeDeps());
    const ana = await request(app).post('/rounds').set('Authorization', tokenFor(ANA));
    const bea = await request(app).post('/rounds').set('Authorization', tokenFor(BEA));
    expect(bea.body.resumed).toBe(false);
    expect(bea.body.round.id).not.toBe(ana.body.round.id);
  });

  it('answers 503 NO_DATA when no stock is ready', async () => {
    const symbols = { countReady: async () => 0, listReady: async () => [], find: async () => null };
    const res = await request(createApp(fakeDeps({ symbols }))).post('/rounds').set('Authorization', tokenFor(ANA));
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('NO_DATA');
  });

  it('a round that cannot be rebuilt answers 500 without naming the stock or a date, in the body or the logs', async () => {
    const market = inMemoryMarket();
    const app = createApp(fakeDeps({ ...market, random: () => 0 }));
    await request(app).post('/rounds').set('Authorization', tokenFor(ANA));
    market.data.set('ZZQX', market.data.get('ZZQX')!.slice(0, 100)); // the stored series lost its window

    const res = await request(app).post('/rounds').set('Authorization', tokenFor(ANA));
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL', message: 'Internal server error' } });
    expect(logs()).toContain('could not be rebuilt');
    expectNoLeak(logs());
  });
});

describe('no other route describes a round', () => {
  it('has no GET /rounds/:id, and GET /rounds lists decided rounds only: an open one is not there', async () => {
    const app = createApp(fakeDeps());
    const { body } = await request(app).post('/rounds').set('Authorization', tokenFor(ANA));
    const single = await request(app).get(`/rounds/${body.round.id}`).set('Authorization', tokenFor(ANA));
    expect(single.status).toBe(404);
    expect(single.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });

    // The list (02 §7, P1) answers 200, without the open round and without anything about it.
    const list = await request(app).get('/rounds').set('Authorization', tokenFor(ANA));
    expect(list.status).toBe(200);
    expect(list.body).toEqual({ rounds: [] });
    expectNoLeak(list.text);
  });
});

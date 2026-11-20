import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { fakeDeps, inMemoryRounds, TEST_JWT_SECRET } from './fakeDeps.js';

const tokenFor = (userId: string) => `Bearer ${jwt.sign({}, TEST_JWT_SECRET, { algorithm: 'HS256', subject: userId })}`;
const ANA = randomUUID();
const BEA = randomUUID();

/** Stores decided rounds directly, in decision order, before anything the API decides. */
function seedDecided(rounds: ReturnType<typeof inMemoryRounds>, userId: string, list: ['buy' | 'pass', number][]) {
  list.forEach(([decision, r], i) => {
    const id = randomUUID();
    rounds.rows.set(id, { id, userId, symbol: 'ZZQX', cutoffDate: '2011-12-20', forwardReturn: r, decision, decidedAt: -1000 + i });
  });
}

const mixed: ['buy' | 'pass', number][] = [
  ['buy', 0.12], ['pass', -0.08], ['buy', 0.03], ['pass', -0.15], ['buy', 0.2], ['pass', 0.01],
  ['buy', -0.02], ['pass', 0.07], ['buy', -0.11], ['pass', 0.05], ['buy', 0.09], ['pass', -0.04],
];

function setup() {
  const rounds = inMemoryRounds();
  const app = createApp(fakeDeps({ rounds, random: () => 0 }));
  const stats = (userId = ANA) => request(app).get('/stats').set('Authorization', tokenFor(userId));
  return { rounds, app, stats };
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /stats', () => {
  it('answers 401 without a token', async () => {
    const { app } = setup();
    expect((await request(app).get('/stats')).status).toBe(401);
  });

  it('answers a new user with every average null and the insufficient verdict', async () => {
    const { stats } = setup();
    const res = await stats();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      rounds: 0,
      buys: 0,
      passes: 0,
      avgPicks: null,
      avgAll: null,
      avgPassed: null,
      edge: null,
      coin: null,
      verdict: 'insufficient',
      roundsUntilVerdict: 10,
      hitRate: null,
      streak: { current: 0, best: 0 },
    });
  });

  it('has the fields of 02 §7, with the coin once there is a verdict to make', async () => {
    const { rounds, stats } = setup();
    seedDecided(rounds, ANA, mixed);
    const { body } = await stats();
    expect(Object.keys(body).sort()).toEqual(
      ['avgAll', 'avgPassed', 'avgPicks', 'buys', 'coin', 'edge', 'hitRate', 'passes', 'rounds', 'roundsUntilVerdict', 'streak', 'verdict'].sort(),
    );
    expect(Object.keys(body.coin).sort()).toEqual(['p5', 'p95', 'percentile', 'trials']);
    expect(body).toMatchObject({ rounds: 12, buys: 6, passes: 6, roundsUntilVerdict: 0 });
    expect(body.coin.trials).toBe(2000);
    expect(['coin', 'better', 'worse']).toContain(body.verdict);
  });

  it('counts decided rounds only: opening a round changes no figure', async () => {
    const { app, rounds, stats } = setup();
    seedDecided(rounds, ANA, mixed);
    const before = (await stats()).body;

    const opened = await request(app).post('/rounds').set('Authorization', tokenFor(ANA));
    expect(opened.body.resumed).toBe(false);
    // Make the open round's frozen return extreme: it would move every average if it were counted.
    rounds.rows.get(opened.body.round.id)!.forwardReturn = 9.99;

    expect((await stats()).body).toEqual(before);
  });

  it('keeps the coin range on reload, and changes it when a new round is decided', async () => {
    const { app, rounds, stats } = setup();
    seedDecided(rounds, ANA, mixed);
    const first = (await stats()).body;
    expect((await stats()).body.coin).toEqual(first.coin);

    const { body } = await request(app).post('/rounds').set('Authorization', tokenFor(ANA));
    await request(app).post(`/rounds/${body.round.id}/decision`).set('Authorization', tokenFor(ANA)).send({ decision: 'buy' });
    const after = (await stats()).body;
    expect(after.rounds).toBe(13);
    expect(after.coin).not.toEqual(first.coin);
  });

  it('counts only the caller\'s rounds', async () => {
    const { rounds, stats } = setup();
    seedDecided(rounds, BEA, mixed);
    expect((await stats(ANA)).body.rounds).toBe(0);
    expect((await stats(BEA)).body.rounds).toBe(12);
  });
});

import { randomUUID } from 'node:crypto';
import { inspect } from 'node:util';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { fakeDeps, inMemoryRounds, TEST_JWT_SECRET } from './fakeDeps.js';

const tokenFor = (userId: string) => `Bearer ${jwt.sign({}, TEST_JWT_SECRET, { algorithm: 'HS256', subject: userId })}`;
const ANA = randomUUID();
const BEA = randomUUID();

/** Stores one decided round; a higher `decidedAt` means decided later. */
function seedDecided(rounds: ReturnType<typeof inMemoryRounds>, userId: string, decidedAt: number, over: { symbol?: string; decision?: 'buy' | 'pass'; r?: number } = {}) {
  const id = randomUUID();
  rounds.rows.set(id, {
    id,
    userId,
    symbol: over.symbol ?? 'ZZQX',
    cutoffDate: '2011-12-20',
    forwardReturn: over.r ?? 0.05,
    decision: over.decision ?? 'buy',
    decidedAt,
  });
  return id;
}

let lines: string[] = [];

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

function setup() {
  const rounds = inMemoryRounds();
  const app = createApp(fakeDeps({ rounds, random: () => 0 }));
  const recent = (query = '', userId = ANA) => request(app).get(`/rounds${query}`).set('Authorization', tokenFor(userId));
  return { rounds, app, recent };
}

describe('GET /rounds?limit=20 (P1)', () => {
  it('answers 401 without a token', async () => {
    const { app } = setup();
    const res = await request(app).get('/rounds');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('answers an empty list for a user with no decided rounds', async () => {
    const { recent } = setup();
    const res = await recent();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ rounds: [] });
  });

  it('lists each decided round with the fields of 02 §7, the name from the symbols table and the shared correct rule', async () => {
    const { rounds, recent } = setup();
    const win = seedDecided(rounds, ANA, 1, { symbol: 'ZZQX', decision: 'buy', r: 0.12 });
    const miss = seedDecided(rounds, ANA, 2, { symbol: 'YYWV', decision: 'pass', r: 0.04 });
    const zero = seedDecided(rounds, ANA, 3, { symbol: 'XXRT', decision: 'pass', r: 0 });

    const res = await recent();
    expect(res.status).toBe(200);
    expect(res.body.rounds.map((round: { id: string }) => round.id)).toEqual([zero, miss, win]);
    expect(Object.keys(res.body.rounds[0]).sort()).toEqual(
      ['cutoffDate', 'correct', 'decidedAt', 'decision', 'forwardReturn', 'id', 'name', 'symbol'].sort(),
    );
    expect(res.body.rounds[2]).toMatchObject({ symbol: 'ZZQX', name: 'Quuxcorp Industries', cutoffDate: '2011-12-20', decision: 'buy', forwardReturn: 0.12, correct: true });
    expect(res.body.rounds[1]).toMatchObject({ symbol: 'YYWV', name: 'Wavelet Holdings', decision: 'pass', correct: false });
    expect(res.body.rounds[0]).toMatchObject({ forwardReturn: 0, correct: true }); // a pass is right at zero (01 §6)
    expect(new Date(res.body.rounds[0].decidedAt).toISOString()).toBe(res.body.rounds[0].decidedAt);
  });

  it('lists the newest decision first, whatever order the rounds were created in', async () => {
    const { rounds, recent } = setup();
    const ids = [5, 1, 4, 2, 3].map((at) => seedDecided(rounds, ANA, at));
    const res = await recent();
    expect(res.body.rounds.map((round: { id: string }) => round.id)).toEqual([ids[0], ids[2], ids[4], ids[3], ids[1]]);
  });

  it('answers 20 rounds by default and respects the limit', async () => {
    const { rounds, recent } = setup();
    for (let i = 0; i < 25; i++) seedDecided(rounds, ANA, i);
    expect((await recent()).body.rounds).toHaveLength(20);
    expect((await recent('?limit=3')).body.rounds).toHaveLength(3);
    expect((await recent('?limit=1')).body.rounds).toHaveLength(1);
    expect((await recent('?limit=20')).body.rounds).toHaveLength(20);
  });

  it.each(['0', '21', 'abc', '-1', '1.5', ''])('answers 400 VALIDATION for limit=%j', async (limit) => {
    const { rounds, recent } = setup();
    seedDecided(rounds, ANA, 1);
    const res = await recent(`?limit=${limit}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
    expect(res.body.rounds).toBeUndefined();
  });

  it('lists only the caller\'s rounds', async () => {
    const { rounds, recent } = setup();
    const mine = seedDecided(rounds, ANA, 1);
    const theirs = seedDecided(rounds, BEA, 2);
    const res = await recent();
    expect(res.body.rounds.map((round: { id: string }) => round.id)).toEqual([mine]);
    expect(res.text).not.toContain(theirs);
    expect((await recent('', BEA)).body.rounds.map((round: { id: string }) => round.id)).toEqual([theirs]);
  });

  it('never lists an open round, and nothing about it reaches the body, the headers or the logs (invariant 1)', async () => {
    const { app, rounds, recent } = setup();
    // Decided rounds use ZZQX on 2011-12-20; the open one is another stock, so any trace of it is a leak.
    seedDecided(rounds, ANA, 1, { symbol: 'ZZQX' });
    const opened = await request(app).post('/rounds').set('Authorization', tokenFor(ANA)).send();
    // Another stock and cutoff: make the open round's symbol and date differ from the decided ones.
    const open = rounds.rows.get(opened.body.round.id)!;
    open.symbol = 'XXRT';
    open.cutoffDate = '2013-07-09';
    lines = [];

    const res = await recent();
    expect(res.status).toBe(200);
    expect(res.body.rounds).toHaveLength(1);
    expect(res.body.rounds.some((round: { id: string }) => round.id === open.id)).toBe(false);
    for (const text of [res.text, JSON.stringify(res.headers), lines.join('\n')]) {
      for (const secret of [open.symbol, 'Rotor Dynamics', open.cutoffDate, open.id]) expect(text).not.toContain(secret);
    }
  });
});

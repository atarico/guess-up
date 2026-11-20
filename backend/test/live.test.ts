import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { createFakeProvider } from '../src/marketdata/fakeProvider.js';
import { UpstreamLimitError } from '../src/marketdata/provider.js';
import { createLiveQuoteService } from '../src/services/liveQuoteService.js';
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

/** random is always 0, so the first round for anyone is ZZQX at its earliest cutoff. */
function setup(quotes: Parameters<typeof createFakeProvider>[1] = { ZZQX: { price: 100, asOf: '2026-11-19' } }, allow = true) {
  const market = inMemoryMarket();
  const rounds = inMemoryRounds();
  const { provider, quoteCalls } = createFakeProvider({}, quotes);
  const liveQuote = createLiveQuoteService({ provider, budget: { tryAcquire: async () => allow }, clock: () => 0 });
  const app = createApp(fakeDeps({ ...market, rounds, liveQuote, random: () => 0 }));
  const open = async (userId = ANA) => (await request(app).post('/rounds').set('Authorization', tokenFor(userId))).body.round.id as string;
  const decide = (id: string, userId = ANA) =>
    request(app).post(`/rounds/${id}/decision`).set('Authorization', tokenFor(userId)).send({ decision: 'buy' });
  const live = (id: string, userId = ANA) => request(app).get(`/rounds/${id}/live`).set('Authorization', tokenFor(userId));
  return { app, market, rounds, quoteCalls, open, decide, live };
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /rounds/:id/live', () => {
  it('answers 401 without a token', async () => {
    const { app, open, decide } = setup();
    const id = await open();
    await decide(id);
    expect((await request(app).get(`/rounds/${id}/live`)).status).toBe(401);
  });

  it('on a decided round returns the price and the move since the cutoff close', async () => {
    const { market, open, decide, live } = setup();
    const id = await open();
    const { body: decided } = await decide(id);
    const cutoffClose = market.data.get('ZZQX')!.find((bar) => bar.d === decided.reveal.cutoffDate)!.close;

    const res = await live(id);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toEqual(['live']);
    expect(res.body.live).toEqual({ available: true, price: 100, asOf: '2026-11-19', sinceCutoff: 100 / cutoffClose - 1 });
  });

  it('answers 200 with available: false when the price cannot be had', async () => {
    const { open, decide, live } = setup({ ZZQX: new UpstreamLimitError('429') });
    const id = await open();
    await decide(id);
    const res = await live(id);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ live: { available: false, reason: 'limit' } });
  });

  it('answers 200 with reason "limit" over budget and never calls the provider', async () => {
    const { quoteCalls, open, decide, live } = setup(undefined, false);
    const id = await open();
    await decide(id);
    const res = await live(id);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ live: { available: false, reason: 'limit' } });
    expect(quoteCalls).toEqual([]);
  });

  it('on an open round answers 409 ROUND_OPEN, calls no provider, and leaks nothing', async () => {
    const { quoteCalls, open, live } = setup();
    const id = await open();
    const res = await live(id);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ROUND_OPEN');
    expectNoLeak(JSON.stringify(res.body) + JSON.stringify(res.headers));
    expect(quoteCalls).toEqual([]);
  });

  it('answers the same 404 for an unknown id, a non-UUID and someone else’s round', async () => {
    const { open, decide, live } = setup();
    const id = await open();
    await decide(id);
    const bodies = [
      await live(randomUUID()),
      await live('not-a-uuid'),
      await live(id, BEA),
    ];
    for (const res of bodies) expect(res.status).toBe(404);
    expect(new Set(bodies.map((res) => JSON.stringify(res.body))).size).toBe(1);
  });

  it("does not reveal another user's open round either: 404, not 409", async () => {
    const { open, live } = setup();
    const id = await open();
    expect((await live(id, BEA)).status).toBe(404);
  });
});

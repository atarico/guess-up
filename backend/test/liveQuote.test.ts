import { describe, expect, it } from 'vitest';
import { createFakeProvider } from '../src/marketdata/fakeProvider.js';
import { UpstreamAuthError, UpstreamLimitError, UpstreamNotFoundError, UpstreamUnavailableError } from '../src/marketdata/provider.js';
import { createLiveQuoteService } from '../src/services/liveQuoteService.js';

const QUOTE = { price: 184.2, asOf: '2026-11-19' };
const MINUTE = 60_000;

/** A service over the fake provider, a budget the test controls and a clock the test moves. */
function setup(quotes: Parameters<typeof createFakeProvider>[1], budget = { allow: true }) {
  const { provider, quoteCalls } = createFakeProvider({}, quotes);
  const clock = { now: 1_000_000 };
  const acquired: number[] = [];
  const service = createLiveQuoteService({
    provider,
    budget: {
      async tryAcquire() {
        acquired.push(clock.now);
        return budget.allow;
      },
    },
    clock: () => clock.now,
  });
  return { service, quoteCalls, clock, acquired, budget };
}

describe('liveQuoteService', () => {
  it('fetches, spends one credit, and returns the price with its date', async () => {
    const { service, quoteCalls, acquired } = setup({ AAPL: QUOTE });
    await expect(service.get('AAPL')).resolves.toEqual({ available: true, price: 184.2, asOf: '2026-11-19' });
    expect(acquired).toHaveLength(1);
    expect(quoteCalls).toEqual([{ symbol: 'AAPL', timeoutMs: 2_500 }]);
  });

  it('serves a second ask within 15 minutes from the cache: no credit, no provider call', async () => {
    const { service, quoteCalls, acquired, clock } = setup({ AAPL: QUOTE });
    await service.get('AAPL');
    clock.now += 15 * MINUTE - 1;
    await expect(service.get('AAPL')).resolves.toEqual({ available: true, price: 184.2, asOf: '2026-11-19' });
    expect(quoteCalls).toHaveLength(1);
    expect(acquired).toHaveLength(1);
  });

  it('asks the provider again once the cache is 15 minutes old', async () => {
    const { service, quoteCalls, clock } = setup({ AAPL: [QUOTE, { price: 190, asOf: '2026-11-20' }] });
    await service.get('AAPL');
    clock.now += 15 * MINUTE;
    await expect(service.get('AAPL')).resolves.toEqual({ available: true, price: 190, asOf: '2026-11-20' });
    expect(quoteCalls).toHaveLength(2);
  });

  it('caches per symbol', async () => {
    const { service, quoteCalls } = setup({ AAPL: QUOTE, MSFT: { price: 400, asOf: '2026-11-19' } });
    await service.get('AAPL');
    await expect(service.get('MSFT')).resolves.toEqual({ available: true, price: 400, asOf: '2026-11-19' });
    expect(quoteCalls.map((call) => call.symbol)).toEqual(['AAPL', 'MSFT']);
  });

  it('over budget returns available: false (limit) and does not call the provider', async () => {
    const { service, quoteCalls } = setup({ AAPL: QUOTE }, { allow: false });
    await expect(service.get('AAPL')).resolves.toEqual({ available: false, reason: 'limit' });
    expect(quoteCalls).toEqual([]);
  });

  it('serves a cached price even when the budget is spent', async () => {
    const { service, budget } = setup({ AAPL: QUOTE });
    await service.get('AAPL');
    budget.allow = false;
    await expect(service.get('AAPL')).resolves.toMatchObject({ available: true });
  });

  it('maps the provider limit to reason "limit"', async () => {
    const { service } = setup({ AAPL: new UpstreamLimitError('429') });
    await expect(service.get('AAPL')).resolves.toEqual({ available: false, reason: 'limit' });
  });

  it.each([
    ['a timeout or network error', new UpstreamUnavailableError('no answer')],
    ['an unknown symbol', new UpstreamNotFoundError('404')],
    ['a rejected key', new UpstreamAuthError('401')],
    ['an error nobody typed', new Error('boom')],
  ])('maps %s to reason "unavailable" and never throws', async (_name, error) => {
    const { service } = setup({ AAPL: error });
    await expect(service.get('AAPL')).resolves.toEqual({ available: false, reason: 'unavailable' });
  });

  it('does not cache a failure: the next ask tries again', async () => {
    const { service, quoteCalls } = setup({ AAPL: [new UpstreamUnavailableError('no answer'), QUOTE] });
    await service.get('AAPL');
    await expect(service.get('AAPL')).resolves.toMatchObject({ available: true });
    expect(quoteCalls).toHaveLength(2);
  });
});

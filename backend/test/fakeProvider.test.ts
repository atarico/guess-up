import { describe, expect, it } from 'vitest';
import { createFakeProvider } from '../src/marketdata/fakeProvider.js';
import { UpstreamLimitError, UpstreamNotFoundError } from '../src/marketdata/provider.js';

const series = { exchange: 'NASDAQ', bars: [{ d: '2026-11-18', close: 145.98 }] };

describe('fake provider', () => {
  it('returns the configured series and records each call', async () => {
    const { provider, calls } = createFakeProvider({ NVDA: series });
    await expect(provider.fetchDailyCloses('NVDA')).resolves.toEqual(series);
    expect(calls).toEqual(['NVDA']);
  });

  it('throws the configured typed error', async () => {
    const { provider } = createFakeProvider({ ZZZZ: new UpstreamNotFoundError('unknown symbol ZZZZ') });
    await expect(provider.fetchDailyCloses('ZZZZ')).rejects.toBeInstanceOf(UpstreamNotFoundError);
  });

  it('answers a list in order, so a first call can fail and a second succeed', async () => {
    const { provider } = createFakeProvider({ AAPL: [new UpstreamLimitError('limit'), series] });
    await expect(provider.fetchDailyCloses('AAPL')).rejects.toBeInstanceOf(UpstreamLimitError);
    await expect(provider.fetchDailyCloses('AAPL')).resolves.toEqual(series);
  });
});

describe('fake provider: quotes', () => {
  it('returns the configured quote and records the symbol and the timeout it was given', async () => {
    const { provider, quoteCalls } = createFakeProvider({}, { AAPL: { price: 184.2, asOf: '2026-11-19' } });
    await expect(provider.fetchQuote('AAPL', 2_500)).resolves.toEqual({ price: 184.2, asOf: '2026-11-19' });
    expect(quoteCalls).toEqual([{ symbol: 'AAPL', timeoutMs: 2_500 }]);
  });

  it('throws the configured typed error', async () => {
    const { provider } = createFakeProvider({}, { AAPL: new UpstreamLimitError('limit') });
    await expect(provider.fetchQuote('AAPL')).rejects.toBeInstanceOf(UpstreamLimitError);
  });
});

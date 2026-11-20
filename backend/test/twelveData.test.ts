import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  UpstreamAuthError,
  UpstreamLimitError,
  UpstreamNotFoundError,
  UpstreamUnavailableError,
} from '../src/marketdata/provider.js';
import { createTwelveDataProvider } from '../src/marketdata/twelveData.js';

const API_KEY = 'TEST-KEY-0123456789abcdef';

afterEach(() => {
  vi.restoreAllMocks();
});

/** A `fetch` that records what it was asked and answers with the given status and body. No network. */
function fakeFetch(status: number, body: unknown) {
  const calls: Array<{ url: URL; init?: RequestInit }> = [];
  const doFetch = (async (url: URL, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { doFetch, calls };
}

// Shaped like the real NVDA response recorded in 02 §5.1 (trimmed to three bars).
const okBody = {
  meta: { symbol: 'NVDA', interval: '1day', currency: 'USD', exchange_timezone: 'America/New_York', exchange: 'NASDAQ', mic_code: 'XNGS', type: 'Common Stock' },
  values: [
    { datetime: '2026-11-17', open: '150.10000', high: '151.00000', low: '148.20000', close: '150.96001', volume: '210000000' },
    { datetime: '2026-11-18', open: '150.50000', high: '153.00000', low: '149.90000', close: '152.10000', volume: '230000000' },
    { datetime: '2026-11-19', open: '152.92000', high: '158.13000', low: '145.71001', close: '145.98000', volume: '320588100' },
  ],
  status: 'ok',
};

describe('Twelve Data client: request', () => {
  it('asks time_series for the most recent 5,000 daily bars, split-adjusted, with the key in a header only', async () => {
    const { doFetch, calls } = fakeFetch(200, okBody);
    await createTwelveDataProvider({ apiKey: API_KEY, fetch: doFetch }).fetchDailyCloses('NVDA');

    const { url, init } = calls[0];
    expect(url.origin + url.pathname).toBe('https://api.twelvedata.com/time_series');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      symbol: 'NVDA',
      interval: '1day',
      outputsize: '5000',
      order: 'asc',
      adjust: 'splits',
    });
    expect(url.toString()).not.toContain(API_KEY);
    expect((init?.headers as Record<string, string>).Authorization).toBe(`apikey ${API_KEY}`);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('returns the exchange and the closes as numbers, oldest first', async () => {
    const { doFetch } = fakeFetch(200, okBody);
    const series = await createTwelveDataProvider({ apiKey: API_KEY, fetch: doFetch }).fetchDailyCloses('NVDA');

    expect(series).toEqual({
      exchange: 'NASDAQ',
      bars: [
        { d: '2026-11-17', close: 150.96001 },
        { d: '2026-11-18', close: 152.1 },
        { d: '2026-11-19', close: 145.98 },
      ],
    });
  });
});

describe('Twelve Data client: typed errors (02 §5.4)', () => {
  const errorBody = (code: number) => ({ code, message: 'from the provider', status: 'error' });

  it.each([
    ['HTTP 429', 429, errorBody(429), UpstreamLimitError],
    ['a 200 whose body says code 429', 200, errorBody(429), UpstreamLimitError],
    ['HTTP 401', 401, errorBody(401), UpstreamAuthError],
    ['HTTP 403', 403, errorBody(403), UpstreamAuthError],
    ['HTTP 404, unknown symbol', 404, errorBody(404), UpstreamNotFoundError],
    ['HTTP 500', 500, errorBody(500), UpstreamUnavailableError],
    ['a 200 without values', 200, { status: 'ok' }, UpstreamUnavailableError],
  ])('maps %s to its typed error, without the key in the message', async (_case, status, body, ErrorType) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { doFetch } = fakeFetch(status, body);
    const error = await createTwelveDataProvider({ apiKey: API_KEY, fetch: doFetch })
      .fetchDailyCloses('NVDA')
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ErrorType);
    expect((error as Error).message).not.toContain(API_KEY);
  });

  it('logs a rejected key loudly, still without the key', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { doFetch } = fakeFetch(401, errorBody(401));
    await createTwelveDataProvider({ apiKey: API_KEY, fetch: doFetch }).fetchDailyCloses('NVDA').catch(() => {});

    expect(logged).toHaveBeenCalledOnce();
    expect(String(logged.mock.calls[0][0])).toContain('TWELVE_DATA_API_KEY');
    expect(String(logged.mock.calls[0][0])).not.toContain(API_KEY);
  });

  it('turns a network failure into UpstreamUnavailableError', async () => {
    const doFetch = (async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    await expect(
      createTwelveDataProvider({ apiKey: API_KEY, fetch: doFetch }).fetchDailyCloses('NVDA'),
    ).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });

  it('gives up after the timeout and reports it as UpstreamUnavailableError', async () => {
    // Never answers; only the timeout signal can end it.
    const doFetch = ((_url: URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      })) as unknown as typeof fetch;

    const error = await createTwelveDataProvider({ apiKey: API_KEY, fetch: doFetch, timeoutMs: 50 })
      .fetchDailyCloses('NVDA')
      .catch((err: unknown) => err);
    expect(error).toBeInstanceOf(UpstreamUnavailableError);
    expect((error as Error).message).toContain('no answer within 50 ms');
  });
});

// Shaped like the real /quote response (02 §5.1): `close` is a string, `datetime` a date only.
const quoteBody = { symbol: 'AAPL', name: 'Apple Inc', datetime: '2026-11-19', close: '184.20000', currency: 'USD' };

describe('Twelve Data client: fetchQuote (P1)', () => {
  it('asks /quote for the symbol with the key in a header only, and reads close as a number', async () => {
    const { doFetch, calls } = fakeFetch(200, quoteBody);
    const quote = await createTwelveDataProvider({ apiKey: API_KEY, fetch: doFetch }).fetchQuote('AAPL');
    expect(quote).toEqual({ price: 184.2, asOf: '2026-11-19' });
    expect(calls[0].url.pathname).toBe('/quote');
    expect(calls[0].url.searchParams.get('symbol')).toBe('AAPL');
    expect(calls[0].url.toString()).not.toContain(API_KEY);
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe(`apikey ${API_KEY}`);
  });

  it('keeps only the date when datetime carries a time', async () => {
    const { doFetch } = fakeFetch(200, { ...quoteBody, datetime: '2026-11-19 15:59:00' });
    const quote = await createTwelveDataProvider({ apiKey: API_KEY, fetch: doFetch }).fetchQuote('AAPL');
    expect(quote.asOf).toBe('2026-11-19');
  });

  it('maps a 429 to UpstreamLimitError and a 404 to UpstreamNotFoundError', async () => {
    const limited = fakeFetch(429, { code: 429, message: 'limit', status: 'error' });
    await expect(createTwelveDataProvider({ apiKey: API_KEY, fetch: limited.doFetch }).fetchQuote('AAPL')).rejects.toBeInstanceOf(UpstreamLimitError);
    const unknown = fakeFetch(404, { code: 404, message: 'unknown', status: 'error' });
    await expect(createTwelveDataProvider({ apiKey: API_KEY, fetch: unknown.doFetch }).fetchQuote('AAPL')).rejects.toBeInstanceOf(UpstreamNotFoundError);
  });

  it('rejects a response that has no usable close', async () => {
    const { doFetch } = fakeFetch(200, { ...quoteBody, close: 'n/a' });
    await expect(createTwelveDataProvider({ apiKey: API_KEY, fetch: doFetch }).fetchQuote('AAPL')).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });

  it('gives up after the timeout it is given, as UpstreamUnavailableError', async () => {
    const neverAnswers = ((_url: URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      })) as unknown as typeof fetch;
    const provider = createTwelveDataProvider({ apiKey: API_KEY, fetch: neverAnswers });
    await expect(provider.fetchQuote('AAPL', 20)).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });
});

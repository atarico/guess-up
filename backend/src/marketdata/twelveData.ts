import {
  type DailySeries,
  type MarketDataProvider,
  type Quote,
  UpstreamAuthError,
  UpstreamLimitError,
  UpstreamNotFoundError,
  UpstreamUnavailableError,
} from './provider.js';

// The only file that knows Twelve Data's URLs and response shapes (02 §2). Shapes checked
// against real responses in 02 §5.1.
const BASE_URL = 'https://api.twelvedata.com';
const TIMEOUT_MS = 5_000; // 02 §5.4

export type TwelveDataDeps = {
  apiKey: string;
  /** Injected so tests never touch the network. */
  fetch?: typeof fetch;
  timeoutMs?: number;
};

type ErrorBody = { status?: unknown; code?: unknown };
type SeriesBody = {
  meta?: { exchange?: unknown };
  values?: Array<{ datetime?: unknown; close?: unknown }>;
};

/** The error code of a response: the HTTP status, or the body's `code` when an error arrives inside a 200. */
function errorCode(httpStatus: number, body: unknown): number | null {
  const parsed = body as ErrorBody | undefined;
  if (parsed?.status === 'error') return typeof parsed.code === 'number' ? parsed.code : httpStatus;
  return httpStatus >= 400 ? httpStatus : null;
}

function errorFor(code: number, symbol: string, endpoint: string): Error {
  const what = `Twelve Data ${endpoint} for ${symbol} failed with ${code}`;
  if (code === 429) return new UpstreamLimitError(what);
  if (code === 401 || code === 403) {
    // Logged loudly (02 §5.4): every later call will fail the same way. Never the key itself.
    console.error(`${what}: the API key was rejected. Check TWELVE_DATA_API_KEY.`);
    return new UpstreamAuthError(what);
  }
  if (code === 404) return new UpstreamNotFoundError(what);
  return new UpstreamUnavailableError(what);
}

function parseSeries(body: unknown, symbol: string): DailySeries {
  const parsed = body as SeriesBody | undefined;
  if (!parsed || !Array.isArray(parsed.values)) {
    throw new UpstreamUnavailableError(`Twelve Data time_series for ${symbol}: unexpected response shape`);
  }
  const exchange = typeof parsed.meta?.exchange === 'string' ? parsed.meta.exchange : null;
  // Prices arrive as strings (02 §5.1). A value that is not a number becomes NaN, and the
  // series check of 02 §5.2 rejects the whole series for it.
  const bars = parsed.values.map((value) => ({ d: String(value.datetime), close: Number(value.close) }));
  return { exchange, bars };
}

type QuoteBody = { datetime?: unknown; close?: unknown };

function parseQuote(body: unknown, symbol: string): Quote {
  const parsed = body as QuoteBody | undefined;
  // `close` is a string and `datetime` a date, possibly with a time after it (02 §5.1). Keep the day only.
  const price = Number(parsed?.close);
  const asOf = typeof parsed?.datetime === 'string' ? parsed.datetime.slice(0, 10) : '';
  if (!Number.isFinite(price) || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
    throw new UpstreamUnavailableError(`Twelve Data quote for ${symbol}: unexpected response shape`);
  }
  return { price, asOf };
}

export function createTwelveDataProvider(deps: TwelveDataDeps): MarketDataProvider {
  const doFetch = deps.fetch ?? fetch;
  const defaultTimeoutMs = deps.timeoutMs ?? TIMEOUT_MS;

  /** The one place a request leaves the process: URL, key header, timeout, and the mapping of failures to typed errors. */
  async function get(endpoint: string, symbol: string, params: Record<string, string>, timeoutMs: number): Promise<unknown> {
    const url = new URL(`/${endpoint}`, BASE_URL);
    url.search = new URLSearchParams({ symbol, ...params }).toString();

    let response: Response;
    try {
      // The key goes in a header, never in the URL, so it cannot end up in a log line or an error.
      response = await doFetch(url, {
        headers: { Authorization: `apikey ${deps.apiKey}` },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      const reason = (err as Error).name === 'TimeoutError' ? `no answer within ${timeoutMs} ms` : 'network error';
      throw new UpstreamUnavailableError(`Twelve Data ${endpoint} for ${symbol}: ${reason}`);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    const code = errorCode(response.status, body);
    if (code !== null) throw errorFor(code, symbol, endpoint);
    return body;
  }

  return {
    async fetchDailyCloses(symbol) {
      const body = await get(
        'time_series',
        symbol,
        {
          interval: '1day',
          outputsize: '5000', // the maximum; with order=asc these are the most recent 5,000 bars (02 §5.1)
          order: 'asc',
          adjust: 'splits',
        },
        defaultTimeoutMs,
      );
      return parseSeries(body, symbol);
    },

    async fetchQuote(symbol, timeoutMs = defaultTimeoutMs) {
      return parseQuote(await get('quote', symbol, {}, timeoutMs), symbol);
    },
  };
}

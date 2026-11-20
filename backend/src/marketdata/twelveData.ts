import {
  type DailySeries,
  type MarketDataProvider,
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

function errorFor(code: number, symbol: string): Error {
  const what = `Twelve Data time_series for ${symbol} failed with ${code}`;
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

export function createTwelveDataProvider(deps: TwelveDataDeps): MarketDataProvider {
  const doFetch = deps.fetch ?? fetch;
  const timeoutMs = deps.timeoutMs ?? TIMEOUT_MS;

  return {
    async fetchDailyCloses(symbol) {
      const url = new URL('/time_series', BASE_URL);
      url.search = new URLSearchParams({
        symbol,
        interval: '1day',
        outputsize: '5000', // the maximum; with order=asc these are the most recent 5,000 bars (02 §5.1)
        order: 'asc',
        adjust: 'splits',
      }).toString();

      let response: Response;
      try {
        // The key goes in a header, never in the URL, so it cannot end up in a log line or an error.
        response = await doFetch(url, {
          headers: { Authorization: `apikey ${deps.apiKey}` },
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (err) {
        const reason = (err as Error).name === 'TimeoutError' ? `no answer within ${timeoutMs} ms` : 'network error';
        throw new UpstreamUnavailableError(`Twelve Data time_series for ${symbol}: ${reason}`);
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }

      const code = errorCode(response.status, body);
      if (code !== null) throw errorFor(code, symbol);
      return parseSeries(body, symbol);
    },
  };
}

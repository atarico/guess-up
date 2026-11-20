/** One daily close. `d` is the trading day as `YYYY-MM-DD`. */
export type DailyClose = { d: string; close: number };

/** A whole daily series from one provider response, oldest bar first (02 §5.1, §5.2). */
export type DailySeries = { exchange: string | null; bars: DailyClose[] };

/**
 * The only shape the rest of the app knows a market-data source by (02 §2, §5.4).
 */
export interface MarketDataProvider {
  fetchDailyCloses(symbol: string): Promise<DailySeries>;
  /**
   * (P1) The latest price of a symbol (02 §5.1, §5.6). `timeoutMs` lets a user-facing caller
   * give up sooner than the client's default; the live price must never hold the game back.
   */
  fetchQuote(symbol: string, timeoutMs?: number): Promise<Quote>;
}

/** A live price and the trading day it belongs to, as `YYYY-MM-DD`. */
export type Quote = { price: number; asOf: string };

// Typed failures (02 §5.4). Messages carry the symbol and the status, never the API key.

/** The provider's credit limit was hit (HTTP 429, or `code: 429` in the body). */
export class UpstreamLimitError extends Error {
  override name = 'UpstreamLimitError';
}

/** The provider rejected the API key (401 or 403). */
export class UpstreamAuthError extends Error {
  override name = 'UpstreamAuthError';
}

/** The provider does not know the symbol (404). */
export class UpstreamNotFoundError extends Error {
  override name = 'UpstreamNotFoundError';
}

/** Network failure, timeout, a 5xx, or a response we cannot read. */
export class UpstreamUnavailableError extends Error {
  override name = 'UpstreamUnavailableError';
}

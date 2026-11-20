import type { DailySeries, MarketDataProvider, Quote } from './provider.js';

type Answers<T> = Record<string, T | Error | Array<T | Error>>;

/** One configured answer: a list is consumed in order, a single value is returned every time. */
function next<T>(configured: T | Error | Array<T | Error> | undefined, symbol: string): T {
  const answer = Array.isArray(configured) ? configured.shift() : configured;
  if (answer === undefined) throw new Error(`fake provider has no answer for ${symbol}`);
  if (answer instanceof Error) throw answer;
  return answer;
}

/**
 * The provider every test uses (02 §5.4, invariant 4): no network.
 * Each symbol maps to a series (or, in `quotes`, a quote) to return, or to an error to throw; a
 * list of answers is consumed in order, one per call, so a test can make the first call fail and
 * the second succeed.
 */
export function createFakeProvider(series: Answers<DailySeries>, quotes: Answers<Quote> = {}) {
  const calls: string[] = [];
  const quoteCalls: Array<{ symbol: string; timeoutMs: number | undefined }> = [];
  const provider: MarketDataProvider = {
    async fetchDailyCloses(symbol) {
      calls.push(symbol);
      return next(series[symbol], symbol);
    },
    async fetchQuote(symbol, timeoutMs) {
      quoteCalls.push({ symbol, timeoutMs });
      return next(quotes[symbol], symbol);
    },
  };
  return { provider, calls, quoteCalls };
}

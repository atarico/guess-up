import type { DailySeries, MarketDataProvider } from './provider.js';

/**
 * The provider every test uses (02 §5.4, invariant 4): no network.
 * Each symbol maps to a series to return, or to an error to throw; a list of answers is
 * consumed in order, one per call, so a test can make the first call fail and the second succeed.
 */
export function createFakeProvider(answers: Record<string, DailySeries | Error | Array<DailySeries | Error>>) {
  const calls: string[] = [];
  const provider: MarketDataProvider = {
    async fetchDailyCloses(symbol) {
      calls.push(symbol);
      const configured = answers[symbol];
      const answer = Array.isArray(configured) ? configured.shift() : configured;
      if (answer === undefined) throw new Error(`fake provider has no answer for ${symbol}`);
      if (answer instanceof Error) throw answer;
      return answer;
    },
  };
  return { provider, calls };
}

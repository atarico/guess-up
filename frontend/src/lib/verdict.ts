import type { StatsResponse } from './api-types';
import { copy, type Part } from './copy';
import { percent, points, share, signedPoints } from './format';

/**
 * One decimal, half away from zero: the rounding Intl applies to every percentage on screen. The
 * verdict works on these rounded numbers so that what it says adds up on screen (S6, 03 §5.4).
 */
function roundTenth(x: number): number {
  return (Math.sign(x) * Math.round(Math.abs(x) * 10)) / 10;
}

/**
 * The verdict sentence for a /stats answer (03 §5.4). Against the coin, the sentence shows the two
 * averages rounded once, and the points are the difference of those two rounded numbers; when it
 * is 0.0 the "no cambió" sentence applies. Which side of the coin's range the user is on is the
 * server's verdict, computed on the raw edge.
 */
export function verdictParts(stats: StatsResponse): Part[] {
  const { verdict } = copy.stats;
  switch (stats.verdict) {
    case 'insufficient':
      return verdict.remaining(stats.roundsUntilVerdict);
    case 'bought_all':
      return verdict.boughtAll;
    case 'bought_none':
      return verdict.boughtNone;
    default: {
      // coin, better and worse always come with both averages (02 §7).
      const picks = roundTenth((stats.avgPicks ?? 0) * 100);
      const all = roundTenth((stats.avgAll ?? 0) * 100);
      const difference = roundTenth(picks - all);
      if (difference === 0) return verdict.same(percent(all / 100));
      const sentence = difference < 0 ? verdict.cost : verdict.gain;
      return sentence(percent(picks / 100), percent(all / 100), points(difference / 100));
    }
  }
}

/** The coin sentence (03 §5.4), or null when the verdict is not measured against the coin. */
export function coinParts(stats: StatsResponse): Part[] | null {
  if (!stats.coin) return null;
  const { coin } = copy.stats;
  const opening = coin.opening(String(stats.buys), String(stats.rounds), signedPoints(stats.coin.p5), signedPoints(stats.coin.p95));
  const continuation =
    stats.verdict === 'better'
      ? coin.above(share(stats.coin.percentile))
      : stats.verdict === 'worse'
        ? // The share of coin trials that beat the user: those strictly above their edge.
          coin.below(share(1 - stats.coin.percentile))
        : coin.within;
  return [...opening, { text: ' ', figure: false }, ...continuation];
}

/** The sentence as plain text, for tests and accessible labels. */
export const plain = (parts: Part[]) => parts.map((part) => part.text).join('');

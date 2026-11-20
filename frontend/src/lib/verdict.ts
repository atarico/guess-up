import type { CoinHistogram, StatsResponse } from './api-types';
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

/**
 * A coin share as shown (03 §5.4): never above 99%. With 2,000 simulated trials, "100%" would claim
 * more than the simulation can prove. The backend counts ties on neither side (02 §6).
 */
const coinShare = (p: number) => share(Math.min(p, 0.99));

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/**
 * The one guard of the coin section (sentence, band markers and histogram): true only when every
 * number it shows is a finite number, as an older backend without a field would not give. The
 * share each verdict shows is the one it reads: the percentile for coin and better, beatenBy for worse.
 */
function coinIsShowable(stats: StatsResponse): boolean {
  const { coin } = stats;
  if (!coin) return false;
  const shownShare = stats.verdict === 'worse' ? coin.beatenBy : coin.percentile;
  // Typed as it may arrive from an older backend: possibly absent, never trusted.
  const histogram: Partial<CoinHistogram> | undefined = coin.histogram;
  const histogramOk =
    !!histogram &&
    isNumber(histogram.start) &&
    isNumber(histogram.width) &&
    Array.isArray(histogram.counts) &&
    histogram.counts.length > 0 &&
    histogram.counts.every(isNumber);
  return [stats.buys, stats.rounds, stats.edge, coin.p5, coin.p95, shownShare].every(isNumber) && histogramOk;
}

/**
 * The sentence under the coin card's histogram: the band, then where the user stands. Within the
 * range and above it show the share of coins the user beat (the percentile); below it, the share
 * that beat the user, without ties (02 §6). Null when `coinIsShowable` says the coin section cannot show.
 */
export function coinCardParts(stats: StatsResponse): Part[] | null {
  if (!stats.coin || !coinIsShowable(stats)) return null;
  const { range, within, above, below } = copy.statsCards.coin;
  const band = range(signedPoints(stats.coin.p5), signedPoints(stats.coin.p95));
  const where =
    stats.verdict === 'worse'
      ? below(coinShare(stats.coin.beatenBy))
      : stats.verdict === 'better'
        ? above(coinShare(stats.coin.percentile))
        : within(coinShare(stats.coin.percentile));
  return [...band, ...where];
}

/** The sentence as plain text, for tests and accessible labels. */
export const plain = (parts: Part[]) => parts.map((part) => part.text).join('');

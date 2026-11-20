// The coin benchmark (01 §8, 02 §6): a coin that buys as many of the user's charts as the user did,
// chosen at random, 2,000 times. Seeded, so the range is the same on every reload.

export const TRIALS = 2000;

/** The coin's edges, and the range nine trials in ten land in. */
export type CoinRange = { p5: number; p95: number; edges: number[] };

/**
 * A small seeded generator of numbers in [0, 1) (mulberry32). Math.random cannot be seeded, and the
 * coin's range must not move between two loads of the same stats.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The coin's seed: a hash (32-bit FNV-1a) of the user id and the number of decided rounds (02 §6).
 * Stable across reloads; it changes only when a new round is decided.
 */
export function coinSeed(userId: string, decidedRounds: number): number {
  let hash = 0x811c9dc5;
  for (const char of `${userId}:${decidedRounds}`) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Each trial chooses `buys` of the returns at random without replacement, and its edge is
 * mean(chosen) - mean(all) (02 §6). `buys` is between 1 and the number of returns. p5 and p95 are
 * the sorted edges at floor(5% of the trials) from each end, so exactly 90% of the trials lie
 * between them, inclusive: "nueve de cada diez veces". Pure: the returns are not modified.
 */
export function coinBenchmark(returns: number[], buys: number, seed: number, trials = TRIALS): CoinRange {
  const rng = mulberry32(seed);
  const n = returns.length;
  const meanAll = returns.reduce((sum, r) => sum + r, 0) / n;
  const pool = [...returns];
  const edges: number[] = [];

  for (let t = 0; t < trials; t++) {
    // A partial Fisher-Yates shuffle: the first `buys` slots become a uniform sample without replacement.
    let chosen = 0;
    for (let i = 0; i < buys; i++) {
      const j = i + Math.floor(rng() * (n - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
      chosen += pool[i];
    }
    edges.push(chosen / buys - meanAll);
  }

  const sorted = [...edges].sort((a, b) => a - b);
  const tail = Math.floor(0.05 * trials);
  return { p5: sorted[tail], p95: sorted[trials - 1 - tail], edges };
}

/** The coin's edges counted in equal bins, for the histogram on the stats screen (C1). */
export type CoinHistogram = { start: number; width: number; counts: number[] };

/**
 * `bins` equal bins from the smallest edge to the largest; every edge is counted once. A value on an
 * inner boundary opens the upper bin, and the largest edge sits in the last one. When every edge is
 * equal there is no range to split: one bin of width 0 holds them all. Pure: the edges are not modified.
 */
export function coinHistogram(edges: number[], bins = 40): CoinHistogram {
  // A loop, not Math.min(...edges): spreading 2,000 values is fine today but needlessly fragile.
  let start = edges[0];
  let max = edges[0];
  for (const edge of edges) {
    if (edge < start) start = edge;
    if (edge > max) max = edge;
  }
  if (max === start) return { start, width: 0, counts: [edges.length] };

  const width = (max - start) / bins;
  const counts: number[] = new Array(bins).fill(0);
  for (const edge of edges) {
    // The clamp covers the largest edge, and floating point that rounds an index up to `bins`.
    counts[Math.min(bins - 1, Math.floor((edge - start) / width))]++;
  }
  return { start, width, counts };
}

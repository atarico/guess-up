import { describe, expect, it } from 'vitest';
import type { StatsResponse } from './api-types';
import { coinCardParts, plain, verdictParts } from './verdict';

const MINUS = '−';
// The coin's bins are not read by these sentences; any valid histogram will do.
const HISTOGRAM = { start: -0.05, width: 0.0025, counts: Array<number>(40).fill(50) };

function stats(overrides: Partial<StatsResponse>): StatsResponse {
  return {
    rounds: 42,
    buys: 19,
    passes: 23,
    avgPicks: 0.021,
    avgAll: 0.034,
    avgPassed: 0.045,
    edge: -0.013,
    coin: { p5: -0.021, p95: 0.02, percentile: 0.17, beatenBy: 0.81, trials: 2000, histogram: HISTOGRAM },
    verdict: 'coin',
    roundsUntilVerdict: 0,
    hitRate: 0.52,
    streak: { current: 2, best: 6 },
    ...overrides,
  };
}

const figures = (parts: { text: string; figure: boolean }[]) => parts.filter((p) => p.figure).map((p) => p.text);

describe('verdictParts (03 §5.4)', () => {
  it('worse or coin with a negative edge: the cost sentence', () => {
    for (const verdict of ['coin', 'worse'] as const) {
      const parts = verdictParts(stats({ verdict }));
      expect(plain(parts)).toBe(
        'Tus selecciones rindieron +2.1% en promedio. Comprar todas las gráficas rindió +3.4%. Tu criterio te costó 1.3 puntos porcentuales por compra.',
      );
      expect(figures(parts)).toEqual(['+2.1%', '+3.4%', '1.3 puntos porcentuales']);
    }
  });

  it('better or coin with a positive edge: the gain sentence', () => {
    for (const verdict of ['coin', 'better'] as const) {
      const parts = verdictParts(stats({ verdict, avgPicks: 0.046, edge: 0.012 }));
      expect(plain(parts)).toBe(
        'Tus selecciones rindieron +4.6% en promedio. Comprar todas las gráficas rindió +3.4%. Tu criterio te sumó 1.2 puntos porcentuales por compra.',
      );
      expect(figures(parts)).toEqual(['+4.6%', '+3.4%', '1.2 puntos porcentuales']);
    }
  });

  it('an edge that rounds to 0.0: the "no cambió" sentence', () => {
    const parts = verdictParts(stats({ avgPicks: 0.0341, avgAll: 0.0339, edge: 0.0002 }));
    expect(plain(parts)).toBe('Tus selecciones y comprar todas las gráficas rindieron lo mismo: +3.4% en promedio. Tu criterio no cambió el resultado.');
    expect(figures(parts)).toEqual(['+3.4%']);
  });

  it('S6: the points are the difference of the two rounded percentages shown, not the rounded raw edge', () => {
    // Raw edge: 2.149 - 3.351 = -1.202 points, which alone would round to 1.2; the sentence shows
    // +2.1% and +3.4%, so it says 1.3 and the sum checks on screen.
    const parts = verdictParts(stats({ avgPicks: 0.02149, avgAll: 0.03351, edge: -0.01202 }));
    expect(figures(parts)).toEqual(['+2.1%', '+3.4%', '1.3 puntos porcentuales']);
  });

  it('S6: equal rounded percentages give "no cambió" even when the raw edge is not zero', () => {
    const parts = verdictParts(stats({ verdict: 'better', avgPicks: 0.03449, avgAll: 0.03351, edge: 0.00098 }));
    expect(plain(parts)).toBe('Tus selecciones y comprar todas las gráficas rindieron lo mismo: +3.4% en promedio. Tu criterio no cambió el resultado.');
  });

  it('an average with floating-point noise around zero shows 0.0%, never −0.0%', () => {
    const parts = verdictParts(stats({ avgPicks: -4.336808689942018e-19, avgAll: 0, edge: -4.336808689942018e-19 }));
    expect(plain(parts)).toBe('Tus selecciones y comprar todas las gráficas rindieron lo mismo: 0.0% en promedio. Tu criterio no cambió el resultado.');
    expect(plain(parts)).not.toContain(MINUS);
  });

  it('negative averages use the real minus sign', () => {
    const parts = verdictParts(stats({ avgPicks: -0.124, avgAll: -0.031, edge: -0.093 }));
    expect(figures(parts)).toEqual([`${MINUS}12.4%`, `${MINUS}3.1%`, '9.3 puntos porcentuales']);
  });

  it('insufficient, several left', () => {
    const parts = verdictParts(stats({ verdict: 'insufficient', rounds: 4, roundsUntilVerdict: 6, coin: null }));
    expect(plain(parts)).toBe('Faltan 6 gráficas para tu primer veredicto.');
    expect(figures(parts)).toEqual(['6 gráficas']);
  });

  it('insufficient, one left', () => {
    const parts = verdictParts(stats({ verdict: 'insufficient', rounds: 9, roundsUntilVerdict: 1, coin: null }));
    expect(plain(parts)).toBe('Falta 1 gráfica para tu primer veredicto.');
    expect(figures(parts)).toEqual(['1 gráfica']);
  });

  it('bought_all', () => {
    expect(plain(verdictParts(stats({ verdict: 'bought_all', coin: null })))).toBe(
      'Compraste todas las gráficas, así que tu resultado es el mismo que el de comprar todo. Prueba dejar pasar las que no te convenzan.',
    );
  });

  it('bought_none', () => {
    expect(plain(verdictParts(stats({ verdict: 'bought_none', avgPicks: null, edge: null, coin: null })))).toBe(
      'Todavía no has comprado ninguna gráfica. Aún no hay nada que medir.',
    );
  });
});

describe('the coin guard (no NaN on screen)', () => {
  // What a response that breaks the contract would carry, such as an older backend without beatenBy.
  // Every other field is valid, histogram included, so each case fails on the field it names.
  const coinWith = (fields: Record<string, unknown>) =>
    ({ p5: -0.021, p95: 0.02, percentile: 0.02, beatenBy: 0.97, trials: 2000, histogram: HISTOGRAM, ...fields }) as StatsResponse['coin'];

  it('passes a complete coin', () => {
    expect(coinCardParts(stats({ verdict: 'worse', coin: coinWith({}) }))).not.toBeNull();
  });

  it('is null, never NaN, when /stats lacks a field the coin section uses', () => {
    expect(coinCardParts(stats({ verdict: 'worse', coin: coinWith({ beatenBy: undefined }) }))).toBeNull();
    expect(coinCardParts(stats({ verdict: 'better', coin: coinWith({ percentile: undefined }) }))).toBeNull();
    expect(coinCardParts(stats({ verdict: 'coin', coin: coinWith({ p5: undefined }) }))).toBeNull();
    expect(coinCardParts(stats({ verdict: 'coin', coin: coinWith({}), buys: undefined as unknown as number }))).toBeNull();
    expect(coinCardParts(stats({ verdict: 'coin', coin: coinWith({}), edge: undefined as unknown as number }))).toBeNull();
  });

  it('is null, never NaN, when a field the coin section uses is not a number', () => {
    expect(coinCardParts(stats({ verdict: 'better', coin: coinWith({ percentile: '0.96' }) }))).toBeNull();
    expect(coinCardParts(stats({ verdict: 'worse', coin: coinWith({ beatenBy: Number.NaN }) }))).toBeNull();
    expect(coinCardParts(stats({ verdict: 'coin', coin: coinWith({ p95: null }) }))).toBeNull();
    expect(coinCardParts(stats({ verdict: 'coin', coin: coinWith({}), rounds: '42' as unknown as number }))).toBeNull();
  });
});

describe('the coin guard covers the histogram', () => {
  const withHistogram = (histogram: unknown) =>
    stats({ verdict: 'coin', coin: { p5: -0.021, p95: 0.02, percentile: 0.17, beatenBy: 0.8, trials: 2000, histogram } as never });

  it('is null, never NaN, when the histogram is missing or has a non-number', () => {
    for (const parts of [coinCardParts]) {
      expect(parts(withHistogram(undefined))).toBeNull();
      expect(parts(withHistogram({ start: -0.05, width: Number.NaN, counts: [1, 2] }))).toBeNull();
      expect(parts(withHistogram({ start: '0', width: 0.1, counts: [1, 2] }))).toBeNull();
      expect(parts(withHistogram({ start: -0.05, width: 0.1, counts: [1, null, 3] }))).toBeNull();
      expect(parts(withHistogram({ start: -0.05, width: 0.1, counts: 'x' }))).toBeNull();
      expect(parts(withHistogram({ start: -0.05, width: 0.1, counts: [] }))).toBeNull();
    }
  });
  it('a valid histogram passes', () => {
    expect(coinCardParts(withHistogram(HISTOGRAM))).not.toBeNull();
  });
});

describe('coinCardParts (the coin card sentence, 03 §5.4)', () => {
  const range = `El 90% de las monedas terminó entre ${MINUS}2.1 y +2.0 puntos. `;

  it('within the range: the share of coins the user beat', () => {
    const parts = coinCardParts(stats({ verdict: 'coin' }))!;
    expect(plain(parts)).toBe(`${range}Tú quedaste dentro de ese rango y le ganaste al 17% de las monedas.`);
  });
  it('above: the share beaten; below: the share that beat the user', () => {
    const above = coinCardParts(stats({ verdict: 'better', coin: { p5: -0.021, p95: 0.02, percentile: 0.96, beatenBy: 0.03, trials: 2000, histogram: HISTOGRAM } }))!;
    expect(plain(above)).toBe(`${range}Tú quedaste por encima de ese rango y le ganaste al 96% de las monedas.`);
    const below = coinCardParts(stats({ verdict: 'worse', coin: { p5: -0.021, p95: 0.02, percentile: 0.02, beatenBy: 0.97, trials: 2000, histogram: HISTOGRAM } }))!;
    expect(plain(below)).toBe(`${range}Tú quedaste por debajo de ese rango: la moneda te ganó el 97% de las veces.`);
  });
  it('never above 99%', () => {
    const parts = coinCardParts(stats({ verdict: 'better', coin: { p5: -0.021, p95: 0.02, percentile: 1, beatenBy: 0, trials: 2000, histogram: HISTOGRAM } }))!;
    expect(plain(parts)).toContain('al 99% de las monedas');
  });
  it('colours the band figures gold; the share has no tone', () => {
    const parts = coinCardParts(stats({ verdict: 'coin' }))!;
    expect(parts.filter((p) => p.tone === 'gold').map((p) => p.text)).toEqual([`${MINUS}2.1`, '+2.0']);
    expect(parts.find((p) => p.text === '17%')?.tone).toBeUndefined();
  });
  it('is null when there is no coin', () => {
    expect(coinCardParts(stats({ verdict: 'insufficient', coin: null }))).toBeNull();
  });
});

describe('verdict figure tones', () => {
  it('your picks are accent, the cost is down, the gain is up', () => {
    const cost = verdictParts(stats({}));
    expect(cost.filter((p) => p.tone).map((p) => [p.text, p.tone])).toEqual([['+2.1%', 'accent'], ['1.3 puntos porcentuales', 'down']]);
    const gain = verdictParts(stats({ avgPicks: 0.046 }));
    expect(gain.filter((p) => p.tone).map((p) => p.tone)).toEqual(['accent', 'up']);
  });
});

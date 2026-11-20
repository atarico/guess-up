import { describe, expect, it } from 'vitest';
import type { StatsResponse } from './api-types';
import { coinParts, plain, verdictParts } from './verdict';

const MINUS = '−';

function stats(overrides: Partial<StatsResponse>): StatsResponse {
  return {
    rounds: 42,
    buys: 19,
    passes: 23,
    avgPicks: 0.021,
    avgAll: 0.034,
    avgPassed: 0.045,
    edge: -0.013,
    coin: { p5: -0.021, p95: 0.02, percentile: 0.17, trials: 2000 },
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

describe('coinParts (03 §5.4)', () => {
  const opening = `Una moneda que compra al azar 19 de estas 42 gráficas queda entre ${MINUS}2.1 y +2.0 puntos nueve de cada diez veces.`;

  it('coin', () => {
    const parts = coinParts(stats({ verdict: 'coin' }))!;
    expect(plain(parts)).toBe(`${opening} Tu resultado está dentro de ese rango. Por ahora, tu criterio no se distingue de lanzar una moneda.`);
    expect(figures(parts)).toEqual(['19', '42', `${MINUS}2.1`, '+2.0']);
  });

  it('better: the share of coin trials the user beat', () => {
    const parts = coinParts(stats({ verdict: 'better', coin: { p5: -0.021, p95: 0.02, percentile: 0.96, trials: 2000 } }))!;
    expect(plain(parts)).toBe(`${opening} Tu resultado está por encima de ese rango. Por ahora, mejor que una moneda: superas al 96% de los lanzamientos.`);
  });

  it('worse: the share of coin trials that beat the user', () => {
    const parts = coinParts(stats({ verdict: 'worse', coin: { p5: -0.021, p95: 0.02, percentile: 0.03, trials: 2000 } }))!;
    expect(plain(parts)).toBe(`${opening} Tu resultado está por debajo de ese rango. Por ahora, peor que una moneda: la moneda te gana el 97% de las veces.`);
  });

  it('is null when the verdict is not measured against the coin', () => {
    expect(coinParts(stats({ verdict: 'insufficient', coin: null }))).toBeNull();
    expect(coinParts(stats({ verdict: 'bought_all', coin: null }))).toBeNull();
  });
});

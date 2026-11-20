import { describe, expect, it } from 'vitest';
import { callLine, headline, liveLine } from './reveal';

describe('callLine (03 §5.3)', () => {
  it('a buy that went up is a good call', () => {
    expect(callLine('buy', 0.12)).toBe('Compraste. Buena decisión.');
  });

  it('a buy that rose too little to show (0.0%) is still a good call', () => {
    expect(callLine('buy', 0.0004)).toBe('Compraste. Buena decisión.');
  });

  it('a buy at a return of exactly zero did not change', () => {
    expect(callLine('buy', 0)).toBe('Compraste. No cambió.');
  });

  it('a buy that went down', () => {
    expect(callLine('buy', -0.08)).toBe('Compraste. Bajó.');
  });

  it('a pass that went down or stayed flat is a good call', () => {
    expect(callLine('pass', -0.08)).toBe('Pasaste. Buena decisión.');
    expect(callLine('pass', 0)).toBe('Pasaste. Buena decisión.');
  });

  it('a pass that went up', () => {
    expect(callLine('pass', 0.12)).toBe('Pasaste. Subió sin ti.');
  });
});

describe('headline (03 §5.3, §4, §10): the number, its arrow, colour and label, decided once', () => {
  it('a gain is up and a loss is down', () => {
    expect(headline(0.12)).toEqual({ value: '+12.0%', arrow: '▲', label: 'Subió', colour: 'text-up' });
    expect(headline(-0.08)).toEqual({ value: '−8.0%', arrow: '▼', label: 'Bajó', colour: 'text-down' });
  });

  it('a number shown as 0.0% has no arrow and is in ink, whatever its sign before rounding', () => {
    const flat = { value: '0.0%', arrow: null, label: null, colour: 'text-ink' };
    expect(headline(0)).toEqual(flat);
    expect(headline(0.0004)).toEqual(flat);
    expect(headline(-0.0004)).toEqual(flat);
  });

  it('the smallest change that shows is up or down', () => {
    expect(headline(0.0006)).toMatchObject({ value: '+0.1%', arrow: '▲' });
    expect(headline(-0.0006)).toMatchObject({ value: '−0.1%', arrow: '▼' });
  });
});

describe('liveLine (P1, 03 §5.3, §9)', () => {
  const NBSP = '\u00a0';

  it('a price with a rise since the cutoff: USD price, the headline arrow and one decimal', () => {
    expect(liveLine({ available: true, price: 184.2, asOf: '2026-11-19', sinceCutoff: 3.1 })).toEqual({
      kind: 'price',
      today: `Hoy: USD${NBSP}184.20 ·`,
      head: { value: '+310.0%', arrow: '▲', label: 'Subió', colour: 'text-up' },
      since: 'desde entonces',
    });
  });

  it('a fall uses the real minus sign and the down arrow', () => {
    expect(liveLine({ available: true, price: 40, asOf: '2026-11-19', sinceCutoff: -0.3 })).toMatchObject({
      kind: 'price',
      head: { value: '−30.0%', arrow: '▼', colour: 'text-down' },
    });
  });

  it('a move that shows as 0.0% has no arrow and is in ink (the same rule as the headline)', () => {
    expect(liveLine({ available: true, price: 100, asOf: '2026-11-19', sinceCutoff: 0.0004 })).toMatchObject({
      kind: 'price',
      head: { value: '0.0%', arrow: null, colour: 'text-ink' },
    });
  });

  it('unavailable for the API limit: the text of 03 §5.3', () => {
    expect(liveLine({ available: false, reason: 'limit' })).toEqual({
      kind: 'note',
      text: 'El precio de hoy no está disponible en este momento (límite de la API).',
    });
  });

  it('unavailable for another reason: the same note without blaming the limit', () => {
    expect(liveLine({ available: false, reason: 'unavailable' })).toEqual({
      kind: 'note',
      text: 'El precio de hoy no está disponible en este momento.',
    });
  });
});

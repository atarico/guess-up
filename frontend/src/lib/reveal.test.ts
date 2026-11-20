import { describe, expect, it } from 'vitest';
import { callLine, headline } from './reveal';

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

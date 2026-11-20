import { describe, expect, it } from 'vitest';
import { callLine, direction } from './reveal';

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

describe('direction (03 §4, §10)', () => {
  it('a return of exactly zero has no arrow and no up or down colour', () => {
    expect(direction(0)).toBeNull();
  });

  it('a gain is up and a loss is down', () => {
    expect(direction(0.12)).toEqual({ arrow: '▲', label: 'Subió', colour: 'text-up' });
    expect(direction(-0.08)).toEqual({ arrow: '▼', label: 'Bajó', colour: 'text-down' });
  });
});

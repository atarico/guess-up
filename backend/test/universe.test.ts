import { describe, expect, it } from 'vitest';
import { SECTORS, UNIVERSE } from '../src/data/universe.js';

describe('universe (01 §10)', () => {
  it('has the 60 approved stocks, each once', () => {
    expect(UNIVERSE).toHaveLength(60);
    expect(new Set(UNIVERSE.map((entry) => entry.symbol)).size).toBe(60);
  });

  it('uses only the 11 sector names of 03 §3, and all of them', () => {
    expect(SECTORS).toHaveLength(11);
    expect(new Set(UNIVERSE.map((entry) => entry.sector))).toEqual(new Set(SECTORS));
  });

  it('has CPB in place of KHC, as approved', () => {
    const symbols = UNIVERSE.map((entry) => entry.symbol);
    expect(symbols).toContain('CPB');
    expect(symbols).not.toContain('KHC');
  });

  it('has a non-empty name for every stock', () => {
    expect(UNIVERSE.every((entry) => entry.name.trim().length > 0)).toBe(true);
  });
});

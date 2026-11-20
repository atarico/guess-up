import { describe, expect, it } from 'vitest';
import type { Part } from './copy';
import { progressParts, remainingAfter, verdictReady } from './progress';

const joined = (parts: Part[] | null) => parts?.map((part) => part.text).join('') ?? null;

describe('remainingAfter: charts left before the first verdict (03 §5.3)', () => {
  it('takes roundsUntilVerdict from a /stats answer when no decision was sent since it was asked', () => {
    expect(remainingAfter(null, { kind: 'stats', roundsUntilVerdict: 6, decidedSinceAsked: false })).toBe(6);
  });

  it('drops an answer asked before a decision, which may or may not count it', () => {
    expect(remainingAfter(null, { kind: 'stats', roundsUntilVerdict: 6, decidedSinceAsked: true })).toBeNull();
    expect(remainingAfter(5, { kind: 'stats', roundsUntilVerdict: 6, decidedSinceAsked: true })).toBe(5);
  });

  it('keeps what it had when /stats fails', () => {
    expect(remainingAfter(4, { kind: 'statsFailed' })).toBe(4);
    expect(remainingAfter(null, { kind: 'statsFailed' })).toBeNull();
  });

  it('counts a recorded decision, and never goes below zero', () => {
    expect(remainingAfter(6, { kind: 'decided' })).toBe(5);
    expect(remainingAfter(1, { kind: 'decided' })).toBe(0);
    expect(remainingAfter(0, { kind: 'decided' })).toBe(0);
  });

  it('stays unknown after a decision when it was unknown', () => {
    expect(remainingAfter(null, { kind: 'decided' })).toBeNull();
  });
});

describe('progressParts: the line under the question', () => {
  it('uses the plural with several charts left', () => {
    expect(joined(progressParts(6))).toBe('Faltan 6 gráficas para tu primer veredicto.');
  });

  it('uses the singular with one chart left', () => {
    expect(joined(progressParts(1))).toBe('Falta 1 gráfica para tu primer veredicto.');
  });

  it('is gone at ten decided charts, and while the number is unknown', () => {
    expect(progressParts(0)).toBeNull();
    expect(progressParts(null)).toBeNull();
  });
});

describe('verdictReady: the notice on the tenth chart', () => {
  it('shows when this decision left no chart to go and /stats has a verdict against the coin', () => {
    expect(verdictReady(1, 'coin')).toBe(true);
    expect(verdictReady(1, 'better')).toBe(true);
    expect(verdictReady(1, 'worse')).toBe(true);
  });

  it('does not show with every chart bought or every chart passed: there is no verdict against the coin', () => {
    expect(verdictReady(1, 'bought_all')).toBe(false);
    expect(verdictReady(1, 'bought_none')).toBe(false);
  });

  it('does not show before the tenth chart, after it, or when the count was unknown', () => {
    expect(verdictReady(1, 'insufficient')).toBe(false);
    expect(verdictReady(2, 'coin')).toBe(false);
    expect(verdictReady(0, 'coin')).toBe(false);
    expect(verdictReady(null, 'coin')).toBe(false);
  });
});

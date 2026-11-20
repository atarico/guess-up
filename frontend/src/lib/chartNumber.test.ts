import { describe, expect, it } from 'vitest';
import { chartNumberAfter } from './chartNumber';

describe('chartNumberAfter (03 §5.3)', () => {
  it('/stats before deciding: the decided rounds plus one', () => {
    expect(chartNumberAfter(null, { kind: 'stats', rounds: 12, decidedSinceAsked: false })).toBe(13);
  });

  it('/stats after deciding: dropped, so the label stays hidden until the next chart asks again', () => {
    // 12 rounds decided before this chart, then this one: the answer may say 12 or 13.
    const dropped = chartNumberAfter(null, { kind: 'stats', rounds: 12, decidedSinceAsked: true });
    expect(dropped).toBeNull();
    const nextChart = chartNumberAfter(dropped, { kind: 'next' });
    expect(nextChart).toBeNull();
    expect(chartNumberAfter(nextChart, { kind: 'stats', rounds: 13, decidedSinceAsked: false })).toBe(14);
  });

  it('/stats after deciding does not change a number already known', () => {
    expect(chartNumberAfter(13, { kind: 'stats', rounds: 12, decidedSinceAsked: true })).toBe(13);
  });

  it('/stats failed: the label stays hidden until the next chart asks again', () => {
    const failed = chartNumberAfter(null, { kind: 'statsFailed' });
    expect(failed).toBeNull();
    const nextChart = chartNumberAfter(failed, { kind: 'next' });
    expect(nextChart).toBeNull();
    expect(chartNumberAfter(nextChart, { kind: 'stats', rounds: 1, decidedSinceAsked: false })).toBe(2);
  });

  it('/stats failed does not change a number already known', () => {
    expect(chartNumberAfter(13, { kind: 'statsFailed' })).toBe(13);
  });

  it('the next chart is one more', () => {
    expect(chartNumberAfter(13, { kind: 'next' })).toBe(14);
  });
});

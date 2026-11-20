import { describe, expect, it } from 'vitest';
import { type DecidedRound, isCorrect, streaks } from '../src/domain/stats.js';

describe('isCorrect (01 §6, 02 §6)', () => {
  it('a buy is right only when the forward return is above zero', () => {
    expect(isCorrect('buy', 0.021)).toBe(true);
    expect(isCorrect('buy', 0)).toBe(false);
    expect(isCorrect('buy', -0.124)).toBe(false);
  });

  it('a pass is right when the forward return is zero or below', () => {
    expect(isCorrect('pass', -0.124)).toBe(true);
    expect(isCorrect('pass', 0)).toBe(true);
    expect(isCorrect('pass', 0.021)).toBe(false);
  });
});

const right: DecidedRound = { decision: 'buy', r: 0.1 };
const wrong: DecidedRound = { decision: 'buy', r: -0.1 };

describe('streaks (01 §8: consecutive right calls, current and best)', () => {
  it('is zero for no rounds', () => {
    expect(streaks([])).toEqual({ current: 0, best: 0 });
  });

  it('counts the run at the end as current and the longest run as best', () => {
    expect(streaks([right, right, wrong, right])).toEqual({ current: 1, best: 2 });
    expect(streaks([right, wrong, right, right, right, wrong])).toEqual({ current: 0, best: 3 });
  });

  it('has current equal to best when every call was right', () => {
    expect(streaks([right, right, right])).toEqual({ current: 3, best: 3 });
  });

  it('is zero when every call was wrong', () => {
    expect(streaks([wrong, wrong])).toEqual({ current: 0, best: 0 });
  });

  it('judges each round with isCorrect, passes included', () => {
    const rightPass: DecidedRound = { decision: 'pass', r: 0 };
    const wrongPass: DecidedRound = { decision: 'pass', r: 0.05 };
    expect(streaks([rightPass, right, wrongPass, rightPass])).toEqual({ current: 1, best: 2 });
  });
});

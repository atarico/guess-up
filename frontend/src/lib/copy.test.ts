import { describe, expect, it } from 'vitest';
import { copy, type Part } from './copy';

const joined = (parts: Part[]) => parts.map((part) => part.text).join('');

describe('copy.play.streak, the top bar pill (03 §5.3)', () => {
  it('says what the streak counts, in the plural', () => {
    expect(joined(copy.play.streak(3))).toBe('Racha: 3 aciertos');
  });

  it('uses the singular for one', () => {
    expect(joined(copy.play.streak(1))).toBe('Racha: 1 acierto');
  });

  it('uses the plural for zero', () => {
    expect(joined(copy.play.streak(0))).toBe('Racha: 0 aciertos');
  });

  it('sets the number apart as the figure', () => {
    expect(copy.play.streak(3).filter((part) => part.figure).map((part) => part.text)).toEqual(['3']);
  });
});

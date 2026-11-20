import { describe, expect, it } from 'vitest';
import { cardAfter, cardOnLoad } from './howItWorks';

describe('cardOnLoad: the first time this browser plays (03 §5.3)', () => {
  it('shows the card when nothing is stored', () => {
    expect(cardOnLoad(null)).toBe(true);
  });

  it('hides it once a decision was made in this browser', () => {
    expect(cardOnLoad('1')).toBe(false);
  });
});

describe('cardAfter', () => {
  it('takes the card away with a decision', () => {
    expect(cardAfter('decided')).toBe(false);
  });

  it('shows it again on "¿Cómo funciona?"', () => {
    expect(cardAfter('asked')).toBe(true);
  });
});

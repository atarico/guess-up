import { describe, expect, it } from 'vitest';
import { nextStep, placeBubble, TOUR_ORDER, tourOnLoad, type TourTarget } from './tour';

const all = () => true;
const without =
  (...missing: TourTarget[]) =>
  (target: TourTarget) =>
    !missing.includes(target);

describe('tourOnLoad: the first time this browser plays (03 §5.3)', () => {
  it('starts the tour when nothing is stored', () => {
    expect(tourOnLoad(null)).toBe(true);
  });

  it('does not start it once the tour was finished or skipped here', () => {
    expect(tourOnLoad('1')).toBe(false);
  });
});

describe('nextStep: the six parts, in order, passing over any not on screen', () => {
  it('points at the chart, the ? zone, the buttons, the streak, the progress and Stats', () => {
    expect(TOUR_ORDER).toEqual(['chart', 'zone', 'decide', 'streak', 'progress', 'stats']);
  });

  it('starts at the first step and walks through all six', () => {
    const seen: number[] = [];
    for (let i = nextStep(-1, all); i !== null; i = nextStep(i, all)) seen.push(i);
    expect(seen).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('passes over the progress line when it is gone (ten decided charts or more)', () => {
    expect(nextStep(3, without('progress'))).toBe(5);
  });

  it('passes over the streak pill while /stats has not answered', () => {
    expect(nextStep(2, without('streak'))).toBe(4);
  });

  it('ends after the last step, or when nothing is left on screen', () => {
    expect(nextStep(5, all)).toBeNull();
    expect(nextStep(-1, () => false)).toBeNull();
  });
});

describe('placeBubble: the bubble next to its part, inside the screen', () => {
  const viewport = { width: 390, height: 664 };
  const bubble = { width: 320, height: 120 };

  it('goes below a part near the top', () => {
    const p = placeBubble({ top: 60, left: 16, width: 358, height: 200 }, bubble, viewport);
    expect(p.side).toBe('below');
    expect(p.top).toBe(60 + 200 + 12);
  });

  it('goes above a part near the bottom', () => {
    const p = placeBubble({ top: 560, left: 16, width: 358, height: 64 }, bubble, viewport);
    expect(p.side).toBe('above');
    expect(p.top).toBe(560 - 12 - 120);
  });

  it('stays 16 px inside the screen on both sides, and its arrow points at the middle of the part', () => {
    const p = placeBubble({ top: 8, left: 300, width: 80, height: 44 }, bubble, viewport);
    expect(p.left).toBe(390 - 16 - 320);
    expect(p.left + p.arrowLeft).toBe(340);
  });

  it('keeps the arrow on the bubble when the part is at the very edge', () => {
    const p = placeBubble({ top: 8, left: 0, width: 10, height: 44 }, bubble, viewport);
    expect(p.left).toBe(16);
    expect(p.arrowLeft).toBe(20);
  });
});

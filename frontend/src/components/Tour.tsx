'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { copy } from '@/lib/copy';
import { nextStep, placeBubble, TOUR_ORDER, type TourTarget } from '@/lib/tour';

/** Space between the lit part and the edge of its light. */
const PAD = 6;

/** The part a step points at, when it is on screen. */
function partOf(target: TourTarget): HTMLElement | null {
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!element) return null;
  const box = element.getBoundingClientRect();
  return box.width > 0 && box.height > 0 ? element : null;
}

const onScreen = (target: TourTarget) => partOf(target) !== null;

/**
 * The guided tour (03 §5.3): the screen dimmed with one part lit, and a bubble beside it with the
 * step's text, `Saltar` and `Siguiente` (`Listo` on the last step). The play screen is inert while it is
 * open, so no tap, key or tab can reach the buttons behind it; Escape skips. Rendered only in the browser,
 * after the chart is on screen.
 */
export function Tour({ onClose }: { onClose: () => void }) {
  const text = copy.play.tour;
  const [step, setStep] = useState(() => nextStep(-1, onScreen));
  const light = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const last = step !== null && nextStep(step, onScreen) === null;

  // Nothing to point at: the tour is over.
  useEffect(() => {
    if (step === null) onClose();
  }, [step, onClose]);

  // Place the light and the bubble after layout, before paint, and again when the screen changes size.
  // The positions are written to the elements directly: they come from measuring the page, not from state.
  useLayoutEffect(() => {
    if (step === null) return;
    const target = TOUR_ORDER[step];
    function place() {
      const part = partOf(target);
      const lit = light.current;
      const box = bubble.current;
      const tip = arrow.current;
      if (!part || !lit || !box || !tip) return;
      const r = part.getBoundingClientRect();
      lit.style.top = `${r.top - PAD}px`;
      lit.style.left = `${r.left - PAD}px`;
      lit.style.width = `${r.width + 2 * PAD}px`;
      lit.style.height = `${r.height + 2 * PAD}px`;
      const p = placeBubble(
        { top: r.top - PAD, left: r.left, width: r.width, height: r.height + 2 * PAD },
        { width: box.offsetWidth, height: box.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight },
      );
      box.style.top = `${p.top}px`;
      box.style.left = `${p.left}px`;
      box.style.visibility = 'visible';
      tip.style.left = `${p.arrowLeft}px`;
      tip.style.top = p.side === 'below' ? '-6px' : '';
      tip.style.bottom = p.side === 'above' ? '-6px' : '';
    }
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [step]);

  // Each step puts the keyboard on its main button; Escape skips the rest.
  useEffect(() => {
    primary.current?.focus();
  }, [step]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (step === null) return null;

  function advance() {
    const next = nextStep(step as number, onScreen);
    if (next === null) onClose();
    else setStep(next);
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* The dim and the light in one box: its shadow covers the rest of the screen. */}
      <div ref={light} aria-hidden="true" className="pointer-events-none fixed rounded-2xl shadow-[0_0_0_9999px_rgba(5,8,14,0.72)] ring-2 ring-accent" />
      <div
        ref={bubble}
        role="dialog"
        aria-modal="true"
        aria-label={text.open}
        className="invisible fixed w-[min(320px,calc(100vw-32px))] rounded-2xl border border-line-strong bg-raised p-4"
      >
        <span ref={arrow} aria-hidden="true" className="absolute size-3 -translate-x-1/2 rotate-45 bg-raised" />
        <p aria-live="polite" className="relative text-[15px] leading-[22px] text-pretty text-fg">
          {text.steps[TOUR_ORDER[step]]}
        </p>
        <div className="relative mt-3 flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} className="min-h-11 px-1 text-sm text-muted underline underline-offset-4">
            {text.skip}
          </button>
          <button ref={primary} type="button" onClick={advance} className="button button-primary min-h-11 px-5">
            {last ? text.done : text.next}
          </button>
        </div>
      </div>
    </div>
  );
}

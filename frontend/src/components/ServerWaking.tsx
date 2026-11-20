'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { isWaking, subscribeWaking, wakingSince } from '@/lib/api';
import { copy } from '@/lib/copy';
import { Logo } from './Logo';
import './ServerWaking.css';

/** Whole seconds since the waking screen appeared, ticking once a second while it shows. */
function useSecondsWaiting(waking: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!waking) return;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [waking]);
  const since = wakingSince();
  return since === null ? 0 : Math.max(0, Math.floor((now - since) / 1_000));
}

/**
 * The cold-start screen (03 §8), over every page while a call has waited more than 3 s (api.ts).
 * The text is announced once through a live region that is on the page from the start and only
 * filled when the wait begins; the visible copy and the counter sit outside it, so a screen reader
 * does not repeat them every second.
 */
export function ServerWaking() {
  // The server render has no waiting call.
  const waking = useSyncExternalStore(subscribeWaking, isWaking, () => false);
  const seconds = useSecondsWaiting(waking);

  return (
    <>
      <p role="status" className="sr-only">
        {waking ? `${copy.waking.title}. ${copy.waking.body}` : ''}
      </p>
      {waking && (
        <div aria-hidden="true" className="fixed inset-0 z-50 flex flex-col bg-page px-4 pt-5 pb-6">
          <div className="mx-auto flex h-11 w-full max-w-[480px] shrink-0 items-center">
            <Logo />
          </div>
          <div className="flex grow flex-col items-center justify-center gap-7 pb-10">
            <svg width="200" height="76" viewBox="0 0 200 76" className="overflow-visible">
              <path d="M4 60 L34 44 L58 52 L88 26 L116 38 L146 14 L196 30" className="waking-track" />
              <path d="M4 60 L34 44 L58 52 L88 26 L116 38 L146 14 L196 30" pathLength={1} className="waking-line" />
              <circle cx="196" cy="30" r="5" className="waking-dot" />
            </svg>
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="font-display text-[1.625rem] leading-8 font-bold tracking-[-0.02em]">{copy.waking.title}</p>
              <p className="max-w-[300px] text-[0.9375rem] leading-[1.375rem] text-pretty text-muted">{copy.waking.body}</p>
            </div>
            <div className="flex w-60 flex-col items-center gap-3">
              <div className="h-1 w-60 overflow-hidden rounded-sm bg-well">
                <div className="waking-bar h-1 w-[30%] rounded-sm bg-accent" />
              </div>
              <span className="tabular text-[0.8125rem] leading-[1.125rem] text-faint">{copy.waking.retrying(seconds)}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

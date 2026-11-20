'use client';

import { useSyncExternalStore } from 'react';
import { isWaking, subscribeWaking } from '@/lib/api';
import { copy } from '@/lib/copy';

/**
 * The cold-start notice (03 §8), over the whole page while a call has waited more than 3 s (api.ts).
 * The live region is always on the page and only filled when the wait begins, because a region
 * added together with its text is often not read out.
 */
export function ServerWaking() {
  // The server render has no waiting call.
  const waking = useSyncExternalStore(subscribeWaking, isWaking, () => false);

  return (
    <div role="status" className={waking ? 'fixed inset-0 z-50 flex items-center justify-center bg-paper px-4' : 'sr-only'}>
      {waking && <p className="max-w-sm text-center text-lg leading-relaxed text-pretty">{copy.serverWaking}</p>}
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { MeResponse, User } from '@/lib/api-types';
import { useAuth } from '@/lib/auth';
import { copy } from '@/lib/copy';

type Me = { kind: 'loading' } | { kind: 'ready'; user: User } | { kind: 'failed' };

/**
 * Proves the session end to end until the game exists: reads the token, calls /auth/me and
 * shows the email. A token the server rejects is handled in api.ts (back to /login with the notice).
 */
export function ProvisionalPlay() {
  const auth = useAuth();
  const router = useRouter();
  const [me, setMe] = useState<Me>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const token = auth.status === 'signedIn' ? auth.token : null;

  // No token: plain /login, no notice; nothing was rejected (03 §7, odd/tasks/03-auth.md L3).
  useEffect(() => {
    if (auth.status === 'signedOut') router.replace('/login');
  }, [auth.status, router]);

  useEffect(() => {
    if (!token) return;
    let current = true;
    api<MeResponse>('/auth/me', { token })
      .then(({ user }) => current && setMe({ kind: 'ready', user }))
      .catch(() => current && setMe({ kind: 'failed' }));
    return () => {
      current = false;
    };
  }, [token, attempt]);

  function retry() {
    setMe({ kind: 'loading' });
    setAttempt(attempt + 1);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-14 pb-8">
      <p translate="no" className="border-b border-rule pb-3 font-mono text-xs tracking-[0.2em] text-muted uppercase">{copy.appTitle}</p>

      {/* Neutral skeleton until the token is read and /auth/me answers: no flash of protected content. */}
      {me.kind === 'loading' && (
        <div aria-busy="true" className="mt-10 flex flex-col gap-3">
          <div className="h-5 w-40 rounded-[2px] bg-rule" />
          <div className="h-5 w-56 rounded-[2px] bg-rule" />
        </div>
      )}

      {me.kind === 'failed' && (
        <div className="mt-10 flex flex-col gap-4">
          <p role="alert">{copy.genericError}</p>
          <button type="button" onClick={retry} className="button button-secondary self-start">
            {copy.retry}
          </button>
        </div>
      )}

      {me.kind === 'ready' && (
        <div className="mt-10 flex flex-col gap-6">
          <p>
            {copy.provisionalPlay.signedInAs} <span className="font-mono break-all">{me.user.email}</span>
          </p>
          <button type="button" onClick={auth.signOut} className="button button-secondary self-start">
            {copy.provisionalPlay.logOut}
          </button>
        </div>
      )}
    </main>
  );
}

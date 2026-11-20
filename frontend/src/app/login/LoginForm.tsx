'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';
import type { AuthResponse } from '@/lib/api-types';
import { useAuth } from '@/lib/auth';
import { copy } from '@/lib/copy';

type Mode = 'signup' | 'login';

const PATHS: Record<Mode, string> = { signup: '/auth/register', login: '/auth/login' };

export function LoginForm({ initialMode, sessionExpired }: { initialMode: Mode; sessionExpired: boolean }) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State reaches the button on the next render; the ref stops a second submit in between.
  const inFlight = useRef(false);

  const text = copy.login[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      const { token } = await api<AuthResponse>(PATHS[mode], { method: 'POST', body: { email, password } });
      signIn(token);
      // The button stays disabled until /play has loaded.
      router.replace('/play');
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'INTERNAL';
      setError(copy.login.errors[code] ?? copy.genericError);
      inFlight.current = false;
      setPending(false);
    }
  }

  function switchMode() {
    setMode(mode === 'signup' ? 'login' : 'signup');
    setError(null);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-14 pb-8">
      {/* min-h-12: a touch target of at least 48 px (03 §10). */}
      <Link href="/" translate="no" className="-mt-5 inline-flex min-h-12 items-end self-start border-b border-rule pb-3 font-mono text-xs tracking-[0.2em] text-muted uppercase">
        {copy.appTitle}
      </Link>

      <h1 className="mt-10 text-3xl font-semibold tracking-tight">{text.title}</h1>

      {sessionExpired && (
        <p role="status" className="mt-4 border-l-2 border-ink pl-3 text-sm">
          {copy.login.sessionExpired}
        </p>
      )}

      {/* noValidate: the browser's own messages would come in the browser's language; the API validates. */}
      <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            {copy.login.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-12 rounded-[2px] border border-muted bg-transparent px-3 text-base"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">
            {copy.login.passwordLabel}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            aria-describedby={mode === 'signup' ? 'password-hint' : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-12 rounded-[2px] border border-muted bg-transparent px-3 text-base"
          />
          {mode === 'signup' && (
            <p id="password-hint" className="text-sm text-muted">
              {copy.login.passwordHint}
            </p>
          )}
        </div>

        <p role="alert" className="min-h-6 text-sm">
          {error}
        </p>

        <button type="submit" disabled={pending} className="button button-primary">
          {pending ? text.pending : text.title}
        </button>
      </form>

      <button type="button" onClick={switchMode} disabled={pending} className="mt-6 min-h-12 touch-manipulation self-center text-sm underline underline-offset-4 hover:decoration-2">
        {text.switchMode}
      </button>
    </main>
  );
}

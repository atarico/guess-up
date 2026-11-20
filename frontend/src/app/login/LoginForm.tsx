'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';
import type { AuthResponse } from '@/lib/api-types';
import { useAuth } from '@/lib/auth';
import { copy } from '@/lib/copy';
import { DEMO, demoArrival } from '@/lib/demo';

type Mode = 'signup' | 'login';

const PATHS: Record<Mode, string> = { signup: '/auth/register', login: '/auth/login' };

type Credentials = { email: string; password: string };

type Props = { initialMode: Mode; sessionExpired: boolean; demoNow: boolean };

export function LoginForm({ initialMode, sessionExpired, demoNow }: Props) {
  const router = useRouter();
  const auth = useAuth();
  const { signIn } = auth;
  const demo = DEMO;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State reaches the button on the next render; the ref stops a second submit in between.
  const inFlight = useRef(false);

  const text = copy.login[mode];

  /** Sends the credentials once at a time (03 §5.2). */
  function send(path: string, body: Credentials) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    void request(path, body);
  }

  /** On success, stores the token and goes to /play; on failure, shows why and frees the button. */
  async function request(path: string, body: Credentials) {
    try {
      const { token } = await api<AuthResponse>(path, { method: 'POST', body });
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(PATHS[mode], { email, password });
  }

  /** The demo link: fills the form with the demo credentials and logs in with them (03 §5.2). */
  function logInAsDemo(credentials: Credentials) {
    setMode('login');
    setEmail(credentials.email);
    setPassword(credentials.password);
    send(PATHS.login, credentials);
  }

  // Arriving with ?demo=1: once the stored session is known, log in only without one, then remove the
  // parameter, so a reload or the back button does not log in again (03 §5.2).
  const arrival = demoArrival(demoNow, auth.status, demo);
  useEffect(() => {
    if (arrival === 'nothing' || arrival === 'wait') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('demo');
    window.history.replaceState(window.history.state, '', url);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the log in starts once the session read from storage is known
    if (arrival === 'logIn' && demo) logInAsDemo(demo);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the arrival decision changes, not on every render
  }, [arrival]);

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

      {/* noValidate: the browser's own messages would come in the browser's language; the API validates.
          method="post": submitted before the JavaScript loads, a form defaults to GET and puts the
          named fields, password included, in the URL. */}
      <form method="post" onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
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

      {demo && (
        <button type="button" onClick={() => logInAsDemo(demo)} disabled={pending} className="mt-2 min-h-12 touch-manipulation self-center text-sm underline underline-offset-4 hover:decoration-2">
          {copy.demoLink}
        </button>
      )}
    </main>
  );
}

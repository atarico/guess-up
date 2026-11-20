'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// One key; the token is a bearer JWT from our backend (03 §7). localStorage is readable by any
// script on the page; the trade-off is in DECISIONS.md.
const TOKEN_KEY = 'guess-up.token';

// Storage can throw when the browser blocks it; then there is simply no saved session.
function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token === null) window.localStorage.removeItem(TOKEN_KEY);
    else window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Nothing to do: the session lasts until the page is closed.
  }
}

/** Forgets the token. Used by api.ts when the server rejects it. */
export function clearStoredToken() {
  writeStoredToken(null);
}

type AuthState = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; token: string };

type AuthContextValue = AuthState & {
  signIn(token: string): void;
  signOut(): void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // `loading` until the token is read: the server has no localStorage, so protected pages show
  // a neutral skeleton first instead of guessing (03 §7).
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const token = readStoredToken();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once on mount, after hydration (03 §7)
    setState(token ? { status: 'signedIn', token } : { status: 'signedOut' });
  }, []);

  const value: AuthContextValue = {
    ...state,
    signIn(token) {
      writeStoredToken(token);
      setState({ status: 'signedIn', token });
    },
    signOut() {
      writeStoredToken(null);
      // A full load of the welcome screen drops every piece of the old session held in memory.
      window.location.replace('/');
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

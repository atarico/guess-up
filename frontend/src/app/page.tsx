'use client';

import { useEffect, useState } from 'react';
import { copy } from '@/lib/copy';

// Provisional page for work unit 1: it calls the deployed backend's /health from the browser,
// which proves NEXT_PUBLIC_API_URL and CORS end to end. Work unit 5 replaces it.
const healthUrl = `${process.env.NEXT_PUBLIC_API_URL}/health`;

type Result =
  | { kind: 'loading' }
  | { kind: 'answered'; httpStatus: number; body: unknown }
  | { kind: 'failed'; reason: string };

export default function Home() {
  const [result, setResult] = useState<Result>({ kind: 'loading' });

  useEffect(() => {
    fetch(healthUrl)
      .then(async (res) => setResult({ kind: 'answered', httpStatus: res.status, body: await res.json() }))
      // A CORS rejection also lands here: the browser hides the response from the page.
      .catch((err: Error) => setResult({ kind: 'failed', reason: err.message }));
  }, []);

  return (
    <main className="mx-auto w-full max-w-xl p-4">
      <h1 className="text-lg font-semibold">{copy.healthCheck.title}</h1>
      <p className="font-mono text-sm break-all">{healthUrl}</p>
      {result.kind === 'loading' && <p>{copy.healthCheck.loading}</p>}
      {result.kind === 'answered' && (
        <pre className="font-mono text-sm whitespace-pre-wrap">
          {result.httpStatus} {JSON.stringify(result.body, null, 2)}
        </pre>
      )}
      {result.kind === 'failed' && (
        <p>
          {copy.healthCheck.error} <span className="font-mono text-sm">{result.reason}</span>
        </p>
      )}
    </main>
  );
}

import Link from 'next/link';
import { copy } from '@/lib/copy';
import { DEMO } from '@/lib/demo';
import { RedirectIfSignedIn } from './RedirectIfSignedIn';

// Welcome, 03 §5.1. Server-rendered, so a first visit shows it at once; a signed-in visitor
// may see it for an instant before the redirect.
export default function Welcome() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-14 pb-8">
      <RedirectIfSignedIn />
      <p translate="no" className="border-b border-rule pb-3 font-mono text-xs tracking-[0.2em] text-muted uppercase">{copy.appTitle}</p>

      <h1 className="mt-10 text-4xl leading-[1.1] font-semibold tracking-tight text-balance">{copy.welcome.headline}</h1>
      <p className="mt-5 text-lg leading-relaxed text-pretty">{copy.tagline}</p>

      <div className="mt-10 flex flex-col gap-3">
        <Link href="/login?mode=signup" className="button button-primary">
          {copy.welcome.start}
        </Link>
        <Link href="/login" className="button button-secondary">
          {copy.welcome.logIn}
        </Link>
        {/* The log-in form fills the demo credentials and submits them (03 §5.1, §5.2). */}
        {DEMO && (
          <Link href="/login?demo=1" className="mt-3 inline-flex min-h-12 items-center self-center text-sm underline underline-offset-4">
            {copy.demoLink}
          </Link>
        )}
      </div>

      <footer className="mt-auto border-t border-rule pt-4 text-xs leading-relaxed text-muted">{copy.welcome.footer}</footer>
    </main>
  );
}

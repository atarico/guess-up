import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { WelcomeChart } from '@/components/WelcomeChart';
import { copy } from '@/lib/copy';
import { DEMO } from '@/lib/demo';
import { RedirectIfSignedIn } from './RedirectIfSignedIn';

// Welcome, 03 §5.1. Server-rendered, so a first visit shows it at once; a signed-in visitor
// may see it for an instant before the redirect.
export default function Welcome() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[480px] flex-col px-4 pt-5 pb-6">
      <RedirectIfSignedIn />
      <div className="flex h-11 shrink-0 items-center">
        <Logo />
      </div>

      <div className="mt-4 shrink-0">
        <WelcomeChart />
      </div>

      <h1 className="font-display mt-7 text-[2.125rem] leading-[2.375rem] font-bold tracking-[-0.02em] text-balance">{copy.welcome.headline}</h1>
      <p className="mt-3 text-base leading-6 text-pretty text-muted">{copy.tagline}</p>

      <div className="min-h-6 grow" />

      <div className="flex shrink-0 flex-col gap-3">
        <Link href="/login?mode=signup" className="button button-primary">
          {copy.welcome.start}
        </Link>
        <Link href="/login" className="button button-secondary">
          {copy.welcome.logIn}
        </Link>
        {/* The log-in form fills the demo credentials and submits them (03 §5.1, §5.2). */}
        {DEMO && (
          <Link href="/login?demo=1" className="flex min-h-11 items-center justify-center text-[0.9375rem] font-medium text-accent underline underline-offset-4">
            {copy.demoLink}
          </Link>
        )}
      </div>

      <footer className="mt-5 shrink-0 text-center text-xs leading-relaxed text-faint">{copy.welcome.footer}</footer>
    </main>
  );
}

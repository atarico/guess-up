export type DemoCredentials = { email: string; password: string };

/**
 * The demo credentials, or null when either one is missing or empty. With null, the demo link is not
 * rendered anywhere (03 §5.2): a link that cannot work is never shown.
 */
export function demoCredentials(email: string | undefined, password: string | undefined): DemoCredentials | null {
  return email && password ? { email, password } : null;
}

// Public by design (02 §5.5). Each variable is written out in full because Next.js copies a
// NEXT_PUBLIC_ value into the bundle at build time only where it appears literally; so a change in
// Vercel needs a new deploy.
export const DEMO = demoCredentials(process.env.NEXT_PUBLIC_DEMO_EMAIL, process.env.NEXT_PUBLIC_DEMO_PASSWORD);

import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ServerWaking } from '@/components/ServerWaking';
import { AuthProvider } from '@/lib/auth';
import { copy } from '@/lib/copy';
import './globals.css';

// Inter for text and figures, Space Grotesk for titles, buttons and the big numbers (03 §4).
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: copy.appTitle,
  description: copy.tagline,
};

// The browser's toolbar takes the page colour on phones (03 §4).
export const viewport: Viewport = {
  themeColor: '#0b0f17',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-MX" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AuthProvider>{children}</AuthProvider>
        {/* Over every page while a call waits for a sleeping server (03 §8). */}
        <ServerWaking />
      </body>
    </html>
  );
}

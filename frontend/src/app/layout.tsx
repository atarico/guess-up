import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ServerWaking } from '@/components/ServerWaking';
import { AuthProvider } from '@/lib/auth';
import { copy } from '@/lib/copy';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: copy.appTitle,
  description: copy.tagline,
};

// The browser's toolbar takes the paper colour on phones (03 §4).
export const viewport: Viewport = {
  themeColor: '#f6f4ef',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-MX" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AuthProvider>{children}</AuthProvider>
        {/* Over every page while a call waits for a sleeping server (03 §8). */}
        <ServerWaking />
      </body>
    </html>
  );
}

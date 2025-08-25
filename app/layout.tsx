import type { Metadata } from 'next';
import { Inter, Poiret_One } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';
import { GoogleScript } from '@/components/auth/GoogleScript';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
  adjustFontFallback: true,
  fallback: ['system-ui', 'sans-serif'],
});

const poiretOne = Poiret_One({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '360Brief - Executive Briefing Platform',
  description: 'Transform communication noise into clear, actionable insights.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poiretOne.variable}`}
      suppressHydrationWarning
    >
      <head>
        <GoogleScript />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

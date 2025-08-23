'use client';

import { Inter, Poiret_One } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from 'sonner';

// Configure Inter for body text
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
  adjustFontFallback: true,
  fallback: ['system-ui', 'sans-serif'],
});

// Configure Poiret One for headings
const poiretOne = Poiret_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  adjustFontFallback: true,
  fallback: ['cursive', 'sans-serif'],
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poiretOne.variable}`}>
      <head>
        <title>360Brief - Your Executive Briefing Platform</title>
        <meta name="description" content="Transform your communication streams into actionable insights with 360Brief." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

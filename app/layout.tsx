import type { Metadata } from 'next';
import { Inter, Poiret_One } from 'next/font/google';
import './globals.css';
import { Providers } from '@/app/providers';
import { Footer } from '../components/layout/footer';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poiretOne.variable} h-full`}>
      <body className={`${inter.className} flex flex-col min-h-full`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
              {children}
            </div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

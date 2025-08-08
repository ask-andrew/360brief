'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Dosis } from "next/font/google";
import "./globals.css";
import { isDevSession } from '@/lib/dev-auth';
import Script from 'next/script';

const dosis = Dosis({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
  adjustFontFallback: true,
  fallback: ['system-ui', 'sans-serif'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Handle authentication and redirects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkAuth = () => {
      const isLoggedIn = isDevSession();
      const isLoginPage = pathname?.startsWith('/dev/login');
      
      if (!isLoggedIn && !isLoginPage) {
        router.push('/dev/login');
      } else if (isLoggedIn && isLoginPage) {
        router.push('/dashboard');
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <html lang="en">
        <body className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="h-full bg-white">
      <head>
        {/* Google Identity Services Library */}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
          onError={(e) => console.error('Failed to load Google Identity Services', e)}
        />
      </head>
      <body className={`${dosis.variable} font-sans antialiased`}>
        <div id="one-tap-container" className="fixed top-4 right-4 z-50"></div>
        {children}
      </body>
    </html>
  );
}

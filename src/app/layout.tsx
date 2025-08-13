'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Dosis } from "next/font/google";
import "./globals.css";
import { isDevSession } from '@/lib/dev-auth';
import Script from 'next/script';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';

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
  const devAuthEnabled = process.env.NEXT_PUBLIC_DEV_AUTH_ENABLED === 'true';
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Handle authentication and redirects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkAuth = () => {
      // Public routes (marketing + auth) always allowed
      const publicPrefixes = [
        '/',
        '/login',
        '/signup',
        '/signin',
        '/why-i-built-this',
        '/demo',
        '/solution-demo',
        '/consolidated-demo',
        '/email-preview',
        '/notification-demo',
        '/test',
      ];

      const isPublicRoute = publicPrefixes.some(prefix => 
        pathname === prefix || pathname.startsWith(`${prefix}/`)
      );

      if (isPublicRoute) {
        setIsLoading(false);
        return;
      }

      // Check if user is authenticated
      const isAuthenticated = devAuthEnabled 
        ? isDevSession() 
        : document.cookie.includes('sb-access-token=');

      if (!isAuthenticated) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <html lang="en" className="h-full">
        <body className={`${dosis.variable} font-sans h-full grid place-items-center`}>
          <div className="animate-pulse">Loading...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="h-full">
      <body className={`${dosis.variable} font-sans h-full`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

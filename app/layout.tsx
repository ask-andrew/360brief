'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Dosis } from "next/font/google";
import "./globals.css";
import { isDevSession } from '@/lib/dev-auth';
import Script from 'next/script';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/layout/AppSidebar';

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
        '/dev/login',
        '/dashboard',
        '/auth/callback',
        '/api/auth/callback'
      ];
      
      const isPublic = publicPrefixes.some((p) => 
        pathname === p || 
        pathname?.startsWith(p + '/') ||
        pathname?.startsWith('/_next') ||
        pathname?.startsWith('/favicon.ico')
      );
      
      if (isPublic) {
        setIsLoading(false);
        return;
      }

      // Dev auth check is now handled by the middleware
      // if (devAuthEnabled) {
      //   const isLoggedIn = isDevSession();
      //   const isDevLogin = pathname?.startsWith('/dev/login');
      //   if (!isLoggedIn && !isDevLogin) {
      //     router.push('/dev/login');
      //     return;
      //   }
      //   if (isLoggedIn && isDevLogin) {
      //     router.push('/dashboard');
      //     return;
      //   }
      // }

      setIsLoading(false);
    };
    
    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <html lang="en">
        <body className={dosis.className}>
          <div className="flex h-screen w-full items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
          </div>
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
      <body className={`${dosis.variable} font-sans antialiased tracking-[0.01em]`}>
        <div id="one-tap-container" className="fixed top-4 right-4 z-50"></div>
        <AuthProvider>
          {pathname?.startsWith('/dashboard') || 
           pathname?.startsWith('/analytics') || 
           pathname?.startsWith('/briefs') ||
           pathname?.startsWith('/preferences') ? (
            <div className="flex h-screen overflow-hidden">
              <AppSidebar />
              <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {children}
              </main>
            </div>
          ) : (
            <>{children}</>
          )}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}

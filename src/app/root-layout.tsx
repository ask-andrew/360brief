'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Inter } from "next/font/google";
import "./globals.css";
import { isDevSession } from '@/lib/dev-auth';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Set mounted state on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle authentication and redirects
  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) return;
    
    // If not in dev session and not on login page, redirect to login
    if (!isDevSession() && !pathname.startsWith('/dev/login')) {
      router.push('/dev/login');
    }
    // If in dev session and on login page, redirect to dashboard
    else if (isDevSession() && pathname === '/dev/login') {
      router.push('/dashboard');
    }
  }, [pathname, router]);

  // Don't render anything until we've checked auth state
  if (!mounted) {
    return null;
  }

  return (
    <html lang="en" className="h-full bg-white">
      <body className={`${inter.variable} font-sans h-full`}>
        {children}
      </body>
    </html>
  );
}

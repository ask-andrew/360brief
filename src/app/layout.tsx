'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Inter } from "next/font/google";
import "./globals.css";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const supabase = createClientComponentClient();

  // Set mounted state on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle authentication and redirects
  useEffect(() => {
    if (!mounted) return;
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session and not on login page, redirect to login
      if (!session && !pathname.startsWith('/dev/login')) {
        router.push('/dev/login');
      }
      // If session exists and on login page, redirect to dashboard
      else if (session && pathname === '/dev/login') {
        router.push('/dashboard');
      }
    };

    checkAuth();
  }, [mounted, pathname, router, supabase.auth]);

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

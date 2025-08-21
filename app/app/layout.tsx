'use client';

import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode, useEffect } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

const inter = Inter({ subsets: ['latin'] });

// Export metadata for static generation
export const metadata: Metadata = {
  title: '360Brief - Executive Digest Platform',
  description: 'Transform your information overload into actionable insights.',
};

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { setSession, setUser } = useAuthStore();

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
        setUser(session.user);
      }
    });

    // Set up auth state change listener
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
        setUser(session.user);
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [router, setSession, setUser]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen overflow-hidden">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Protect routes that require authentication
  useEffect(() => {
    if (!loading && !user && pathname && !pathname.startsWith('/auth')) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
    }
  }, [user, loading, pathname]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Don't show sidebar on auth pages
  if (!pathname || pathname.startsWith('/auth') || pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-white p-6">
        {children}
      </main>
    </div>
  );
}

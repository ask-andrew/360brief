'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isLoading, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    
    // If authentication is required but no session exists, redirect to login
    if (requireAuth && !session) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(pathname)}`);
    }
    
    // If authentication is not required but a session exists, redirect to dashboard
    if (!requireAuth && session) {
      router.push(redirectTo);
    }
  }, [isLoading, session, requireAuth, router, redirectTo, pathname]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If auth state is as expected, render children
  if ((requireAuth && session) || (!requireAuth && !session)) {
    return <>{children}</>;
  }

  // Default return (should be caught by the redirects above)
  return null;
}

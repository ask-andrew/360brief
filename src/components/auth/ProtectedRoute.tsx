'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || !session) {
        // Redirect to login if not authenticated
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (requiredRole && user.user_metadata?.role !== requiredRole) {
        // Redirect to unauthorized if role doesn't match
        router.push('/unauthorized');
      } else {
        // User is authenticated and authorized
        setIsAuthorized(true);
      }
    }
  }, [user, session, loading, requiredRole, router]);

  if (loading || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

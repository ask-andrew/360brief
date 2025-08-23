'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@components/auth/protected-route';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Main dashboard content that will be wrapped in Suspense
function DashboardContent() {
  const { user, isLoading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login');
    }
  }, [isLoading, session, router]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!session) {
    return null; // Will redirect from useEffect
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email?.split('@')[0] || 'User'}!
          </p>
        </div>
      </div>

      {/* Dashboard content will go here */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stats cards will go here */}
      </div>
    </div>
  );
}

// Main dashboard page component
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

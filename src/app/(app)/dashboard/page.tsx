'use client';

import dynamicFn from 'next/dynamic';
import { Suspense } from 'react';

// Define the loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Dynamically import the dashboard content with no SSR
const DashboardContent = dynamicFn(
  () => import('./DashboardContent'),
  { 
    ssr: false,
    loading: () => <LoadingSpinner />
  }
) as React.ComponentType<any>;

// Export configuration for Next.js
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardContent />
    </Suspense>
  );
}

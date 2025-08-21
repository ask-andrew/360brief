'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

// Disable SSR for the dashboard content to prevent hydration issues
const DashboardContent = dynamic<{}>(
  () => import('.'),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[500px] w-full" />
  }
);

export function DashboardClient() {
  const [mounted, setMounted] = useState(false);

  // This ensures the component only renders on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  return <DashboardContent />;
}

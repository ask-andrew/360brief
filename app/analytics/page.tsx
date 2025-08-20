'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AnalyticalDashboard from '@/components/analytics/AnalyticalDashboard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle client-side only rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle authentication state
  useEffect(() => {
    if (user === null) {
      router.push('/login');
    } else if (user !== undefined) {
      setIsLoading(false);
    }
  }, [user, router]);

  if (isLoading || !isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will be redirected by the effect
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <AnalyticalDashboard />
      </div>
    </div>
  );
}

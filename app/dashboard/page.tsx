'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      const redirectedFrom = searchParams?.get('redirectedFrom') || '/dashboard';
      router.push(`/login?redirectedFrom=${encodeURIComponent(redirectedFrom)}`);
    }
  }, [user, loading, router, searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user.email || 'User'}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <h2 className="text-lg font-medium text-gray-900">Welcome to your dashboard, {user.user_metadata?.name || 'User'}!</h2>
            <p className="mt-2 text-gray-600">Your personalized dashboard will appear here.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

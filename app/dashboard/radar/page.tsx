'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RadarChart from '@/components/RadarChart';
import { createClient } from '@/lib/supabase/client';

interface RadarItem {
  id: string;
  summary: string;
  impactArea: string;
  urgencyScore: 'Low' | 'Medium' | 'High';
  severityScore: 'Minor' | 'Major' | 'Critical';
  suggestedAction: string;
  relatedEmails: string[];
}

export default function RadarPage() {
  const [data, setData] = useState<RadarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          console.log('User not authenticated, redirecting to login');
          router.push('/auth/login?redirect=/dashboard/radar');
          return;
        }

        setIsAuthenticated(true);

        // Now fetch radar data
        await fetchRadarData();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login?redirect=/dashboard/radar');
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  const fetchRadarData = async () => {
    try {
      setLoading(true);
      console.log('Fetching radar data...');

      const response = await fetch('/api/radar');

      if (response.status === 401) {
        console.log('Unauthorized, redirecting to login');
        router.push('/auth/login?redirect=/dashboard/radar');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!Array.isArray(result)) {
        console.error("Fetched data is not an array:", result);
        setData([]);
      } else {
        console.log(`Successfully loaded ${result.length} radar items`);
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching radar data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-500 mb-4">Please sign in to view the Executive Risk Radar.</p>
            <button
              onClick={() => router.push('/auth/login?redirect=/dashboard/radar')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Executive Risk Radar</h1>
        <p className="text-gray-600">AI-powered insights into critical business issues and opportunities</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading radar data...</p>
          </div>
        </div>
      ) : (
        <RadarChart data={data} />
      )}

      {data.length === 0 && !loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="text-gray-400 text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500 mb-4">
              Connect your Gmail account to see AI-powered insights, or the system will show demo data for preview.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/connections')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full"
              >
                Connect Gmail Account
              </button>
              <button
                onClick={fetchRadarData}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors w-full"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

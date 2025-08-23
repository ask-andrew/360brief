'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';

interface GoogleData {
  events: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
    attendees?: Array<{
      email: string;
      status: string;
    }>;
    htmlLink?: string;
  }>;
  emails: Array<{
    id: string;
    threadId: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    snippet: string;
    labels: string[];
  }>;
  user: {
    email: string;
    name?: string;
  };
}

export function useGoogleData(session: Session | null) {
  const [data, setData] = useState<GoogleData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Skip if no session or session is still loading
    if (!session) {
      setLoading(false);
      return;
    }

    // Create an AbortController to cancel the fetch if the component unmounts
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        // Skip if we already have data or there's an ongoing request
        if (data || loading) return;
        
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/google-data', {
          credentials: 'include', // Include cookies for auth
          signal, // Add the AbortSignal to the fetch options
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // If unauthorized, redirect to login
            router.push('/login');
            return;
          }
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err: unknown) {
        // Don't set error if the fetch was aborted
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Error fetching Google data:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure the session is fully established
    const timer = setTimeout(() => {
      fetchData();
    }, 100);

    // Cleanup function to abort the fetch if the component unmounts
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [session, router, data, loading]);

  return { data, loading, error };
}

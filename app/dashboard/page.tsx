'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Session } from '@supabase/supabase-js';

// ... other imports

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!searchParams) return;
    
    // Check if a code parameter exists in the URL
    const code = searchParams.get('code');

    const handleAuthCallback = async () => {
      try {
        if (code) {
          // If code exists, attempt to exchange it for a session
          setLoading(true);
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Error exchanging code:', error);
            // On failure, remove the code and redirect to sign-in
            router.replace('/signin');
          } else {
            console.log('Session exchanged successfully!', data.session);
            // On success, the session is set and we clean up the URL
            setSession(data.session);
            router.replace('/dashboard');
          }
        } else {
          // If no code, just get the current session
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession) {
            router.replace('/signin');
          } else {
            setSession(currentSession);
          }
        }
      } catch (error) {
        console.error('An unexpected error occurred:', error);
        router.replace('/signin');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();

  }, [router, searchParams]);

  // Handle rendering based on loading and session state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // If there's no session after the check, show a message or redirect
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-800">
        <h1 className="text-2xl font-bold mb-4">You are not signed in.</h1>
        <p className="text-lg mb-6">Redirecting to sign-in page...</p>
      </div>
    );
  }

  // Render dashboard content for authenticated users
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to your Dashboard!</h1>
        <p className="text-gray-600">This is a protected page for authenticated users.</p>
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700">User Session Details:</h2>
          <pre className="mt-2 text-sm text-gray-600 whitespace-pre-wrap break-words">
            {JSON.stringify(session.user, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}

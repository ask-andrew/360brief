'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { setDevSession, isDevSession } from '@/lib/dev-auth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DevLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const devAuthEnabled = process.env.NEXT_PUBLIC_DEV_AUTH_ENABLED === 'true';
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If dev auth is disabled, never allow access to this page
    if (!devAuthEnabled) {
      router.replace('/login');
      return;
    }

    // Check if we already have a valid session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setDevSession();
        router.replace('/dashboard');
      }
    };
    
    checkSession();
  }, [router, devAuthEnabled, supabase.auth]);

  const handleDevLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Initiating dev login...');
      
      // Call our development session endpoint
      const response = await fetch('/api/dev/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response from API:', errorData);
        throw new Error(errorData.error || `Failed to create development session: ${response.status} ${response.statusText}`);
      }

      const { access_token, refresh_token } = await response.json();
      console.log('Received tokens from API');
      
      if (!access_token || !refresh_token) {
        throw new Error('No access token or refresh token received');
      }
      
      // Set the session in the client
      console.log('Setting session in client...');
      const { data: sessionData, error: authError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      console.log('Session set result:', { sessionData, authError });
      
      if (authError) {
        console.error('Error setting session:', authError);
        throw authError;
      }
      
      // Set dev session flag
      console.log('Setting dev session flag...');
      setDevSession();
      
      // Force a hard refresh to ensure all session data is loaded
      console.log('Redirecting to dashboard...');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Dev login error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">Dev Login</h1>
        <p className="mb-6 text-gray-600 text-center">
          This will sign you in as a development user with full access.
          <br />
          <span className="text-sm text-yellow-600">For development and testing only.</span>
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm w-full">
            {error}
          </div>
        )}
        
        <button
          onClick={handleDevLogin}
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold text-lg w-full mb-4 ${
            isLoading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </>
          ) : (
            'Sign in as Developer'
          )}
        </button>
        
        <div className="text-xs text-gray-400 mt-2 text-center">
          This will create a development session with full access to the application.
          <br />
          Use only in development environments.
        </div>
      </div>
    </div>
  );
}

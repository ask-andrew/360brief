'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // This page handles the redirect after the OAuth flow.
    // The Supabase client automatically processes the session exchange
    // when it loads on this page. We just need to check if it was successful.
    const handleAuth = async () => {
      // Check for a session. The Supabase client will have already handled
      // the PKCE exchange if this is a callback.
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Redirect to dashboard or home if a session is found
        router.replace('/dashboard');
      } else {
        // If no session, the auth flow failed or it's an invalid state
        // Redirect to login
        router.replace('/login');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Completing Sign In</h2>
        <p className="text-gray-600">Please wait while we complete your authentication...</p>
      </div>
    </div>
  );
}
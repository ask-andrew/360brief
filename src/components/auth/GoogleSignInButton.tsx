'use client';

import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { FaSpinner } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      
      // Get the redirect URL from query params or default to /dashboard
      const redirectTo = searchParams?.get('redirectTo') || '/dashboard';
      
      // Start the OAuth flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
    } catch (error) {
      console.error('Error signing in with Google:', error);
      // Error handling will be done by the auth callback
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
    >
      {loading ? (
        <FaSpinner className="animate-spin" />
      ) : (
        <FcGoogle className="w-5 h-5" />
      )}
      Continue with Google
    </Button>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

// Generate a random string for code verifier
const generateRandomString = (length: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => ('0' + b.toString(16)).slice(-2))
    .join('');

// Generate code challenge from verifier
const generateCodeChallenge = async (verifier: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

interface UseGoogleOAuthOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useGoogleOAuth = ({ onSuccess = () => {}, onError = () => {} }: UseGoogleOAuthOptions = {}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const startOAuthFlow = useCallback(async (redirectPath = '/dashboard') => {
    try {
      setLoading(true);
      setError(null);

      // Generate PKCE code verifier and challenge
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store code_verifier and redirect path in sessionStorage
      sessionStorage.setItem('pkce_code_verifier', codeVerifier);
      sessionStorage.setItem('redirect_path', redirectPath);

      // Start OAuth flow
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
          },
          scopes: [
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events.readonly',
          ].join(' '),
        },
      });

      if (authError) throw authError;
      onSuccess();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start OAuth flow');
      setError(error);
      onError(error);
      toast({
        title: 'Authentication Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [onError, onSuccess, supabase.auth]);

  return { startOAuthFlow, loading, error, resetError: () => setError(null) };
};

export default useGoogleOAuth;

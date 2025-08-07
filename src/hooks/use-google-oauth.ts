import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { toast } from './use-toast';
import { useAuthStore } from '../store/auth-store';

interface UseGoogleOAuthOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useGoogleOAuth = ({
  onSuccess,
  onError,
}: UseGoogleOAuthOptions = {}): {
  startOAuthFlow: (redirectPath?: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
  resetError: () => void;
} => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleError = useCallback((err: unknown, context: string): string => {
    const error = err instanceof Error ? err : new Error(String(err));
    const errorMessage = error.message || 'An unknown error occurred';
    console.error(`[${context}]`, error);
    setError(error);
    onError?.(error);
    return errorMessage;
  }, [onError]);

  const startOAuthFlow = useCallback(async (redirectPath = '/dashboard'): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const scopes = [
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
      ];

      console.log('Starting OAuth flow with scopes:', scopes);

      const redirectUrl = new URL(window.location.origin + window.location.pathname);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            response_type: 'code',
          },
          scopes: scopes.join(' '),
        },
      });

      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }

      console.log('OAuth flow started, data:', data);
    } catch (err) {
      const errorMessage = handleError(err, 'Error starting OAuth flow');
      toast({
        title: 'Authentication Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [handleError]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    console.log('Checking for OAuth response...');
    console.log('Current URL:', window.location.href);

    const handleOAuthResponse = async (): Promise<void> => {
      try {
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('Detected OAuth callback in URL hash');

          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token') || undefined;

          if (accessToken) {
            // Ensure both tokens are always strings, using empty string as fallback for refresh_token
            const sessionParams = {
              access_token: accessToken,
              refresh_token: refreshToken || ''
            };
            
            const { data: { session }, error } = await supabase.auth.setSession(sessionParams);

            if (error) throw error;
            if (!session) throw new Error('No session returned after setting session');

            console.log('Session set successfully for:', session.user?.email);

            setSession(session);
            setUser(session.user);

            window.history.replaceState({}, document.title, window.location.pathname);

            if (window.location.pathname !== '/dashboard') {
              router.replace('/dashboard');
            }

            onSuccess?.();
            return;
          }
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw sessionError;
        }

        if (session?.user) {
          console.log('User already authenticated:', session.user.email);
          setSession(session);
          setUser(session.user);

          if (window.location.pathname === '/login') {
            router.replace('/dashboard');
          }
        }
      } catch (err) {
        const errorMessage = handleError(err, 'Error during OAuth callback');
        toast({
          title: 'Authentication Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    };

    handleOAuthResponse();
  }, [setSession, setUser, router, onSuccess, handleError]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    startOAuthFlow,
    loading,
    error,
    resetError,
  };
};

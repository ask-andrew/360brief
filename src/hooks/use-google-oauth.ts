import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { toast } from './use-toast';
import { useAuthStore } from '../store/auth-store';

declare global {
  interface Window {
    google: any;
  }
}

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

      // Check if FedCM is available and use it if possible
      const isFedCMAvailable = 'FederatedCredential' in window;
      console.log('FedCM available:', isFedCMAvailable);

      // First, try to use the regular OAuth flow with FedCM support
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
            response_type: 'code',
            // Enable FedCM if available
            ...(isFedCMAvailable && {
              fedcm: '1',
              fedcm_modal: '1',
            }),
          },
          scopes: scopes.join(' '),
          // Enable One Tap sign-in
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }

      console.log('OAuth flow started, data:', data);
      
      // If we have a URL, redirect to it (for non-FedCM flow)
      if (data.url) {
        window.location.href = data.url;
      }
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
        // First, check if we have a session already
        const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw sessionError;
        }

        // If we already have a valid session, use it
        if (existingSession?.user) {
          console.log('Found existing session for user:', existingSession.user.email);
          setSession(existingSession);
          setUser(existingSession.user);
          router.push('/dashboard');
          onSuccess?.();
          return;
        }

        // Check for OAuth callback in URL
        const hash = window.location.hash;
        if (hash && (hash.includes('access_token') || hash.includes('error'))) {
          console.log('Processing OAuth callback from URL');
          
          // Let Supabase handle the OAuth callback
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error during OAuth callback:', error);
            throw error;
          }
          
          if (!data.session) {
            throw new Error('No session returned after OAuth callback');
          }
          
          console.log('OAuth callback successful for user:', data.session.user.email);
          setSession(data.session);
          setUser(data.session.user);
          
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          router.push('/dashboard');
          onSuccess?.();
          return;
        }
        
        // If we get here, we're not in a callback and don't have a session
        console.log('No active session and not in OAuth callback');
        
        // If we're on the login page, just return and let the login button be shown
        if (window.location.pathname === '/login' || window.location.pathname === '/dev/login') {
          return;
        }
        
        // Otherwise, redirect to login
        router.push('/login');
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

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  onSuccess = () => {},
  onError = () => {},
}: UseGoogleOAuthOptions = {}): {
  startOAuthFlow: (redirectPath?: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
  resetError: () => void;
} => {
  const router = useRouter();
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

      // Store the redirect path for after successful authentication
      localStorage.setItem('sb-redirect-to', redirectPath);

      // Check if FedCM is available and use it if possible
      const isFedCMAvailable = 'FederatedCredential' in window;
      console.log('FedCM available:', isFedCMAvailable);

      // Define query parameters for Google OAuth
      const queryParams = {
        access_type: 'offline',
        prompt: 'select_account',
        include_granted_scopes: 'true',
        ...(isFedCMAvailable && {
          fedcm: '1',
          fedcm_modal: '1',
        }),
      };

      // Let Supabase handle the entire OAuth flow including PKCE
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: scopes.join(' '),
          queryParams,
        },
      });

      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }

      // Supabase will handle the redirect to Google
      console.log('OAuth flow started, redirecting to Google...');
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

    // This listener is the single source of truth for authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in:', session.user?.email);
          setSession(session);
          setUser(session.user);

          // Get the stored redirect path or use default
          const redirectTo = localStorage.getItem('sb-redirect-to') || '/dashboard';
          localStorage.removeItem('sb-redirect-to');

          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          router.push(redirectTo);
          onSuccess?.();
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setSession(null);
          setUser(null);
          // Optional: redirect to login page
          router.push('/login');
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, setSession, setUser, onSuccess]);

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

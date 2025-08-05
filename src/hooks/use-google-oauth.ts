import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { toast } from './use-toast';
import { useAuthStore } from '../store/auth-store';

interface UseGoogleOAuthProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseGoogleOAuthReturn {
  startOAuthFlow: (redirectPath?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  resetError: () => void;
}

export const useGoogleOAuth = ({
  onSuccess,
  onError,
}: UseGoogleOAuthProps = {}): UseGoogleOAuthReturn => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Use individual selectors to prevent unnecessary re-renders
  const setUser = useAuthStore((state) => state.setUser);
  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = useAuthStore((state) => state.setLoading);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Handle component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleError = useCallback((error: unknown, context: string = 'OAuth error'): string => {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[${context}]`, error);
    
    if (isMounted.current) {
      setError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
    
    return errorMessage;
  }, [onError]);

  const startOAuthFlow = useCallback(async (redirectPath = '/dashboard'): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Store the redirect path in session storage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('oauth_redirect', redirectPath);
      }
      
      // Define the scopes we need for Gmail and Calendar access
      const scopes = [
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
      ];

      console.log('Starting OAuth flow with scopes:', scopes);
      
      // Start the Supabase OAuth flow with the required scopes
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            // PKCE is enabled by default in Supabase v2
          },
          scopes: scopes.join(' '), // Explicitly pass scopes
        },
      });

      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }
      
      console.log('OAuth flow started, data:', data);
    } catch (error) {
      const errorMessage = handleError(error as Error, 'Error starting OAuth flow');
      
      toast({
        title: 'Authentication Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [handleError]);

  // Handle the OAuth callback when the page loads with a code or token
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    console.log('Checking for OAuth callback...');
    console.log('Current URL:', window.location.href);

    const handleCallback = async (): Promise<void> => {
      const url = new URL(window.location.href);
      
      // Log all URL parameters for debugging
      console.log('URL search params:', Object.fromEntries(url.searchParams.entries()));
      
      // Check for OAuth response in URL search parameters (PKCE flow)
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      console.log('OAuth callback params from search:', { code, error, errorDescription });

      // Check URL fragment for OAuth response (implicit/PKCE fallback)
      const fragment = window.location.hash.substring(1);
      let fragmentParams = new URLSearchParams();
      let accessTokenFromFragment: string | null = null;
      let refreshTokenFromFragment: string | null = null;
      
      if (fragment) {
        fragmentParams = new URLSearchParams(fragment);
        accessTokenFromFragment = fragmentParams.get('access_token');
        refreshTokenFromFragment = fragmentParams.get('refresh_token');
        console.log('Fragment params:', {
          access_token: accessTokenFromFragment ? '[REDACTED]' : null,
          refresh_token: refreshTokenFromFragment ? '[REDACTED]' : null,
          expires_in: fragmentParams.get('expires_in'),
          token_type: fragmentParams.get('token_type'),
          provider_token: fragmentParams.get('provider_token') ? '[REDACTED]' : null
        });
      }

      // If we have an access token in the fragment, handle it first
      if (accessTokenFromFragment) {
        console.log('Processing OAuth response from URL fragment...');
        
        try {
          // First, set the session with the access token
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessTokenFromFragment,
            refresh_token: refreshTokenFromFragment || ''
          });
          
          if (sessionError) {
            console.error('Error setting session:', sessionError);
            throw sessionError;
          }
          
          if (!session) {
            throw new Error('No session returned after setting session');
          }
          
          console.log('Session set successfully, getting user...');
          
          // Then, refresh the session to ensure it's valid
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Error getting user:', userError);
            throw userError;
          }
          
          if (user) {
            console.log('User authenticated successfully:', user.email);
            
            // Update the auth store
            setSession(session);
            setUser(user);
            
            // Clean up the URL by removing the fragment
            const cleanUrl = new URL(window.location.href);
            cleanUrl.hash = '';
            window.history.replaceState({}, document.title, cleanUrl.toString());
            
            // Get the redirect path from session storage or use the default
            const redirectPath = sessionStorage.getItem('oauth_redirect') || '/dashboard';
            console.log('Redirecting to:', redirectPath);
            
            // Clear the redirect from storage
            sessionStorage.removeItem('oauth_redirect');
            
            // Use router.replace for client-side navigation without full page reload
            router.replace(redirectPath);
            return;
          } else {
            throw new Error('No user returned after authentication');
          }
        } catch (error) {
          console.error('Error in OAuth callback:', error);
          handleError(error as Error, 'Error processing OAuth response');
          // Redirect to login page on error
          window.location.href = '/login?error=auth_error';
          return;
        }
      }

      try {
        if (error) {
          const errorMessage = errorDescription || 'Authentication failed';
          throw new Error(errorMessage);
        }

        if (!code) {
          return;
        }

        setLoading(true);
        
        try {
          console.log('Exchanging authorization code for session...');
          
          // Exchange the authorization code for a session
          const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (authError) {
            console.error('Error exchanging code for session:', authError);
            throw authError;
          }
          
          if (session && isMounted.current) {
            console.log('Session established successfully from code exchange');
            setSession(session);
            setUser(session.user);
            
            // Get the redirect path from session storage or use the default
            const redirectPath = sessionStorage.getItem('oauth_redirect') || '/dashboard';
            sessionStorage.removeItem('oauth_redirect');
            
            // Clean up the URL by removing OAuth parameters
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('code');
            cleanUrl.searchParams.delete('state');
            cleanUrl.searchParams.delete('error');
            cleanUrl.searchParams.delete('error_description');
            cleanUrl.hash = ''; // Clear any fragments
            
            // Only update URL if we're not already on the clean path
            if (window.location.href !== cleanUrl.toString()) {
              window.history.replaceState({}, '', cleanUrl.toString());
            }
            
            // Redirect to the intended page
            router.push(redirectPath);
            onSuccess?.();
          }
        } catch (error) {
          console.error('[OAuth] Session error:', error);
          throw error;
        }
      } catch (error) {
        console.error('[OAuth] Callback error:', error);
        if (isMounted.current) {
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
          setError(errorMessage);
          toast({
            title: 'Authentication Error',
            description: errorMessage,
            variant: 'destructive',
          });
          onError?.(error instanceof Error ? error : new Error(errorMessage));
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    // Add a small delay to ensure the page is fully loaded
    const timer = setTimeout(handleCallback, 100);
    return () => clearTimeout(timer);
  }, [searchParams, router, setLoading, setSession, setUser, onSuccess, onError, handleError]);
  
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    startOAuthFlow,
    isLoading,
    error,
    resetError,
  };
};

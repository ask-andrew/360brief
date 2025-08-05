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

  // Handle the OAuth callback when the page loads with a code
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

      console.log('OAuth callback params:', { code, error, errorDescription });

      // If no code or error, check for implicit flow in fragment
      if ((!code || code === 'undefined') && !error) {
        // Try to handle implicit flow if needed (not recommended for SPAs)
        const fragment = window.location.hash.substring(1);
        if (fragment) {
          const fragmentParams = new URLSearchParams(fragment);
          const accessToken = fragmentParams.get('access_token');
          if (accessToken) {
            // If we have an access token directly, we can use it
            try {
              setLoading(true);
              const { data: { session }, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: fragmentParams.get('refresh_token') || ''
                // Only include properties that match the expected type
              });

              if (sessionError) throw sessionError;
              if (session) {
                setSession(session);
                setUser(session.user);
                // Clean up the URL
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            } catch (err) {
              handleError(err as Error);
            } finally {
              setLoading(false);
            }
          }
        }
        return;
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
          // Exchange the authorization code for a session
          // This will automatically handle the PKCE flow
          const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (authError) {
            throw authError;
          }
          
          if (session && isMounted.current) {
            setSession(session);
            setUser(session.user);
            
            // Get the redirect path from session storage or use the default
            const redirectPath = sessionStorage.getItem('oauth_redirect') || '/dashboard';
            sessionStorage.removeItem('oauth_redirect');
            
            // Clean up the URL by removing the code parameter
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('code');
            window.history.replaceState({}, '', cleanUrl.toString());
            
            // Notify success
            toast({
              title: 'Signed in successfully',
              description: 'You have been successfully authenticated.'
            });
            
            onSuccess?.();
            router.push(redirectPath);
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

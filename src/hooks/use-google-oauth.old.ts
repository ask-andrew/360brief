import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, ReadonlyURLSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';

interface UseGoogleOAuthProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useGoogleOAuth = ({ 
  onSuccess, 
  onError 
}: UseGoogleOAuthProps = {}): {
  startOAuthFlow: (redirectPath?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  resetError: () => void;
} => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setSession, setLoading } = useAuthStore((state) => ({
    setUser: state.setUser,
    setSession: state.setSession,
    setLoading: state.setLoading
  }));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, context: string = 'OAuth error'): string => {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[${context}]`, error);
    setError(errorMessage);
    onError?.(error instanceof Error ? error : new Error(errorMessage));
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

      // Start the Supabase OAuth flow with the required scopes
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            scope: scopes.join(' '), // Join scopes with space as required by OAuth
          },
          scopes: scopes.join(' '), // Also include scopes in the options for Supabase
        },
      });
      
      if (oauthError) {
        throw oauthError;
      }
      
      // The user will be redirected to the OAuth provider and then back to our callback
    } catch (err) {
      const errorMessage = handleError(err, 'Error starting OAuth flow');
      
      toast({
        title: 'Authentication Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle the OAuth callback when the page loads with a code
  useEffect((): (() => void) => {
    if (typeof window === 'undefined') {
      return () => {}; // Return empty cleanup function for server-side rendering
    }
    
    let isMounted = true;
    
    const handleCallback = async (): Promise<void> => {
      try {
        console.log('[OAuth] Starting OAuth callback handler');
        
        if (!searchParams) {
          throw new Error('No search params available in OAuth callback');
        }
        
        const params = Object.fromEntries(searchParams.entries());
        console.log('[OAuth] Callback URL params:', params);
        
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const provider = searchParams.get('provider');
        
        console.log('[OAuth] Extracted params:', { code, error, errorDescription, provider });
        
        if (error) {
          const errorDetails = { 
            error, 
            errorDescription,
            currentUrl: window.location.href,
            searchParams: params,
            timestamp: new Date().toISOString(),
            provider
          };
          
          console.error('[OAuth] Authentication failed:', errorDetails);
          
          const errorMessage = errorDescription || 'Authentication failed';
          setError(errorMessage);
          
          toast({
            title: 'Authentication Error',
            description: errorMessage,
            variant: 'destructive',
          });
          
          onError?.(new Error(errorMessage));
          return;
        }
      
        if (code) {
          try {
            setLoading(true);
            
            // The session is already handled by the callback route
            // Just get the session to update the UI
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) throw sessionError;
            
            if (session) {
              setSession(session);
              setUser(session.user);
              
              // Get the redirect path from session storage or use the default
              const redirectPath = sessionStorage.getItem('oauth_redirect') || '/dashboard';
              sessionStorage.removeItem('oauth_redirect');
              
            }
          } catch (error) {
            console.error('Error in OAuth callback:', error);
            if (isMounted) {
              handleError(error, 'Error in OAuth callback');
            }
          }
        }
      } catch (error) {
        console.error('Error in OAuth callback:', error);
        if (isMounted) {
          handleError(error, 'Error in OAuth callback');
        }
      }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [searchParams, router, setUser, setSession, setLoading, onError, onSuccess, handleError]);

  // Explicitly type the destructured parameters in the dependency array
  type UseEffectDeps = [
    typeof searchParams,
    typeof router,
    typeof setUser,
    typeof setSession,
    typeof setLoading,
    typeof onError,
    typeof onSuccess,
    typeof handleError
  ];
  
  // This is just to satisfy TypeScript's type checking
  const _deps: UseEffectDeps = [
    searchParams,
    router,
    setUser,
    setSession,
    setLoading,
    onError,
    onSuccess,
    handleError
  ];
  
  return {
    startOAuthFlow,
    isLoading,
    error,
    resetError: () => setError(null),
  };
}

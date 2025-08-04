import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';

export function useGoogleOAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setSession, setLoading } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle the OAuth flow
  const startOAuthFlow = useCallback(async (redirectPath = '/dashboard') => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Store the redirect path in session storage
      sessionStorage.setItem('oauth_redirect', redirectPath);
      
      // Define the scopes we need for Gmail and Calendar access
      const scopes = [
        'email', // Basic profile info
        'profile', // Basic profile info
        'https://www.googleapis.com/auth/gmail.readonly', // Read-only access to Gmail
        'https://www.googleapis.com/auth/calendar.readonly', // Read-only access to Calendar
        'https://www.googleapis.com/auth/calendar.events.readonly', // Read-only access to Calendar events
      ];

      // Start the Supabase OAuth flow with the required scopes
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
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
      console.error('Error starting OAuth flow:', err);
      setError('Failed to start authentication. Please try again.');
      setIsLoading(false);
      
      toast({
        title: 'Authentication Error',
        description: 'Failed to start Google authentication. Please try again.',
        variant: 'destructive',
      });
    }
  }, []);

  // Handle the OAuth callback when the page loads with a code
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        console.error('OAuth error:', { error, errorDescription });
        setError(errorDescription || 'Authentication failed');
        
        toast({
          title: 'Authentication Error',
          description: errorDescription || 'Failed to authenticate with Google',
          variant: 'destructive',
        });
        return;
      }
      
      if (code) {
        try {
          setLoading(true);
          
          // Exchange the code for a session
          const { data: { session }, error: sessionError } = 
            await supabase.auth.exchangeCodeForSession(code);
            
          if (sessionError || !session) {
            throw sessionError || new Error('No session after authentication');
          }
          
          // Update the auth store
          setSession(session);
          setUser(session.user);
          
          // Get the redirect path from session storage or use the default
          const redirectPath = sessionStorage.getItem('oauth_redirect') || '/dashboard';
          sessionStorage.removeItem('oauth_redirect');
          
          // Redirect to the dashboard or the original URL
          router.push(redirectPath);
          
          toast({
            title: 'Signed in successfully',
            description: 'You have been successfully signed in with Google.',
          });
          
        } catch (err) {
          console.error('Error completing OAuth flow:', err);
          setError('Failed to complete authentication. Please try again.');
          
          toast({
            title: 'Authentication Error',
            description: 'Failed to complete Google authentication',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
          setIsLoading(false);
        }
      }
    };
    
    handleCallback();
  }, [searchParams, router, setUser, setSession, setLoading]);

  return {
    startOAuthFlow,
    isLoading,
    error,
  };
}

// Hook to check if the user has connected their Google account
export function useGoogleConnectionStatus(userId?: string) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const checkConnection = async () => {
      try {
        const response = await fetch(`/api/user/${userId}/google/status`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to check Google connection status');
        }
        
        setIsConnected(data.isConnected);
      } catch (err) {
        console.error('Error checking Google connection status:', err);
        setError('Failed to check Google connection status');
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [userId]);

  return {
    isConnected,
    isLoading,
    error,
  };
}

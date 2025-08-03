import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './use-auth';
import { getGoogleAuthUrl } from '@/lib/google/oauth';

export function useGoogleOAuth() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle the OAuth flow
  const startOAuthFlow = useCallback(async (redirectPath = '/dashboard') => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Store the redirect path in session storage
      sessionStorage.setItem('oauth_redirect', redirectPath);
      
      // Generate the OAuth URL
      const authUrl = getGoogleAuthUrl(redirectPath);
      
      // Open the OAuth consent screen in a popup
      const width = 600;
      const height = 800;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      window.open(
        authUrl,
        'google-oauth',
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
      );
      
    } catch (err) {
      console.error('Error starting OAuth flow:', err);
      setError('Failed to start authentication. Please try again.');
      setIsLoading(false);
    }
  }, []);

  // Handle the OAuth callback
  const handleOAuthCallback = useCallback(async (code: string, state?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Complete the OAuth flow
      await loginWithGoogle();
      
      // Redirect to the original URL or dashboard
      const redirectPath = state || '/dashboard';
      router.push(redirectPath);
      
    } catch (err) {
      console.error('Error completing OAuth flow:', err);
      setError('Failed to complete authentication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [loginWithGoogle, router]);

  // Check for OAuth callback in the URL
  useEffect(() => {
    const checkForOAuthCallback = () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      const state = url.searchParams.get('state');
      
      if (code) {
        handleOAuthCallback(code, state || undefined);
      } else if (error) {
        setError(`Authentication error: ${error}`);
      }
    };

    // Only run on the client side
    if (typeof window !== 'undefined') {
      checkForOAuthCallback();
    }
  }, [handleOAuthCallback]);

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

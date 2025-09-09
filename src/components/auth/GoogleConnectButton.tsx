'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
// No toast import needed as it's already handled in the hook
import { supabase } from '@/lib/supabase/client';

interface GoogleConnectButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  redirectPath?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export function GoogleConnectButton({
  variant = 'outline',
  size = 'default',
  className = '',
  redirectPath = '/dashboard',
  onSuccess,
  onError,
  disabled = false,
}: GoogleConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle button click: let the server endpoint perform the redirect to Google
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      // Use the existing Gmail authorize endpoint and let it handle the redirect
      const authEndpoint = `${origin}/api/auth/gmail/authorize?redirect=${encodeURIComponent(redirectPath)}`;
      window.location.href = authEndpoint;
    } catch (err) {
      console.error('Error connecting Google account:', err);
      setError(err instanceof Error ? err.message : String(err));
      if (onError) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Show error message if there was an error
  if (error) {
    return (
      <div className="text-sm text-red-600">
        <p>Error: {error}</p>
        <Button 
          variant="link" 
          onClick={handleConnect}
          className="p-0 h-auto text-sm"
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleConnect}
      disabled={isConnecting || disabled}
      className={`flex items-center gap-2 ${className}`}
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      <span>Connect with Google</span>
    </Button>
  );
}

// Component to show the connection status
export function GoogleConnectionStatus({ userId }: { userId: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        // Use the existing auth status endpoint
        const statusUrl = `${origin}/api/auth/gmail/status`;
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        const response = await fetch(statusUrl, {
          credentials: 'include',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check Google connection status');
        }

        // The status route returns `authenticated`, not `isConnected`
        setIsConnected(Boolean(data.authenticated));
      } catch (err) {
        console.error('Error checking Google connection status:', err);
        setError('Failed to check Google connection status');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      checkConnection();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        Checking connection status...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        <p>Error: {error}</p>
        <Button 
          variant="link" 
          onClick={() => window.location.reload()}
          className="p-0 h-auto text-sm"
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="text-sm text-green-600 flex items-center">
      <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span>Google account connected</span>
    </div>
  );
}

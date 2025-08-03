'use client';

import { useState } from 'react';
import { useGoogleOAuth } from '@/hooks/use-google-oauth';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from '@/components/ui/use-toast';

interface GoogleConnectButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  redirectPath?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function GoogleConnectButton({
  variant = 'outline',
  size = 'default',
  className = '',
  redirectPath = '/dashboard',
  onSuccess,
  onError,
}: GoogleConnectButtonProps) {
  const { startOAuthFlow, isLoading, error } = useGoogleOAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle button click
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await startOAuthFlow(redirectPath);
      
      if (onSuccess) {
        onSuccess();
      }
      
      toast({
        title: 'Successfully connected Google account',
        description: 'Your Google account has been connected successfully.',
      });
    } catch (err) {
      console.error('Error connecting Google account:', err);
      
      if (onError) {
        onError(err);
      }
      
      toast({
        title: 'Error connecting Google account',
        description: 'Failed to connect your Google account. Please try again.',
        variant: 'destructive',
      });
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
      disabled={isLoading || isConnecting}
      className={`flex items-center gap-2 ${className}`}
    >
      {isLoading || isConnecting ? (
        <Icons.spinner className="h-4 w-4 animate-spin" />
      ) : (
        <Icons.google className="h-4 w-4" />
      )}
      <span>Connect with Google</span>
    </Button>
  );
}

// Component to show the connection status
export function GoogleConnectionStatus({ userId }: { userId: string }) {
  const { isConnected, isLoading, error } = useGoogleConnectionStatus(userId);

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Icons.spinner className="mr-2 h-3 w-3 animate-spin" />
        Checking connection status...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center text-sm">
      {isConnected ? (
        <>
          <Icons.checkCircle className="mr-2 h-4 w-4 text-green-500" />
          <span>Google account connected</span>
        </>
      ) : (
        <>
          <Icons.alertCircle className="mr-2 h-4 w-4 text-yellow-500" />
          <span>Google account not connected</span>
        </>
      )}
    </div>
  );
}

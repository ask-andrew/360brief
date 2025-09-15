'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, ExternalLink } from 'lucide-react';

interface GmailConnectButtonProps {
  redirectTo?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function GmailConnectButton({
  redirectTo,
  variant = 'default',
  size = 'default',
  className = '',
  children,
  disabled = false
}: GmailConnectButtonProps) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const currentPath = redirectTo || window.location.pathname;
      const authUrl = `/api/auth/gmail/authorize?redirect=${encodeURIComponent(currentPath)}`;

      // Redirect to Gmail OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Gmail connection:', error);
      setConnecting(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={disabled || connecting}
      variant={variant}
      size={size}
      className={className}
    >
      {connecting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Connecting...
        </>
      ) : (
        <>
          <Mail className="h-4 w-4 mr-2" />
          {children || 'Connect Gmail'}
          <ExternalLink className="h-3 w-3 ml-1 opacity-60" />
        </>
      )}
    </Button>
  );
}
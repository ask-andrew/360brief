'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface GmailStatus {
  authenticated: boolean;
  user_id?: string;
  email?: string;
  expires_at?: number;
  expired?: boolean;
  requiresAuth?: boolean;
  error?: string;
}

interface GmailConnectionStatusProps {
  onConnectionRequired?: () => void;
  showRefreshButton?: boolean;
  compact?: boolean;
}

export function GmailConnectionStatus({
  onConnectionRequired,
  showRefreshButton = true,
  compact = false
}: GmailConnectionStatusProps) {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const checkGmailStatus = async () => {
    try {
      const response = await fetch('/api/auth/gmail/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check Gmail status:', error);
      setStatus({
        authenticated: false,
        error: 'Failed to check connection status'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshTokens = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/auth/gmail/refresh', {
        method: 'POST'
      });

      if (response.ok) {
        // Refresh the status after successful token refresh
        await checkGmailStatus();
      } else {
        const error = await response.json();
        console.error('Token refresh failed:', error);

        if (error.requiresAuth) {
          handleConnectionRequired();
        }
      }
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnectionRequired = () => {
    if (onConnectionRequired) {
      onConnectionRequired();
    } else {
      // Default behavior: redirect to Gmail authorization
      window.location.href = '/api/auth/gmail/authorize?redirect=' + encodeURIComponent(window.location.pathname);
    }
  };

  useEffect(() => {
    checkGmailStatus();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${compact ? 'text-sm' : ''}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-gray-600">Checking Gmail connection...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={`flex items-center space-x-2 ${compact ? 'text-sm' : ''}`}>
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-red-600">Unable to check Gmail status</span>
      </div>
    );
  }

  const isExpired = status.expired || (status.expires_at && status.expires_at < Date.now() / 1000);
  const isConnected = status.authenticated && !isExpired;

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {isConnected ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              Gmail Connected
            </Badge>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
              {isExpired ? 'Expired' : 'Not Connected'}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleConnectionRequired}
              className="text-xs"
            >
              {isExpired ? 'Reconnect' : 'Connect'} Gmail
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <span>Gmail Connection</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700 font-medium">Connected</span>
            </div>

            {status.email && (
              <p className="text-sm text-gray-600">
                Connected as: <span className="font-medium">{status.email}</span>
              </p>
            )}

            {status.expires_at && (
              <p className="text-xs text-gray-500">
                <Clock className="h-3 w-3 inline mr-1" />
                Expires: {new Date(status.expires_at * 1000).toLocaleDateString()}
              </p>
            )}

            {showRefreshButton && (
              <Button
                size="sm"
                variant="outline"
                onClick={refreshTokens}
                disabled={refreshing}
                className="w-full"
              >
                {refreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Connection
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span className="text-orange-700 font-medium">
                {isExpired ? 'Connection Expired' : 'Not Connected'}
              </span>
            </div>

            {status.error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {status.error}
              </p>
            )}

            <p className="text-sm text-gray-600">
              {isExpired
                ? 'Your Gmail connection has expired. Please reconnect to continue generating briefs with your email data.'
                : 'Connect your Gmail account to generate briefs from your real email data.'
              }
            </p>

            <Button
              onClick={handleConnectionRequired}
              className="w-full"
              size="sm"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isExpired ? 'Reconnect Gmail' : 'Connect Gmail'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
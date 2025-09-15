'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface GmailDebugStatus {
  authenticated: boolean;
  user_id?: string;
  user_email?: string;
  gmail_tokens_stored?: boolean;
  token_expires?: string;
  token_length?: number;
  token_scope?: string;
  token_created?: string;
  token_updated?: string;
  token_error?: string;
  has_refresh_token?: boolean;
}

export function GmailDebugPanel() {
  const [status, setStatus] = useState<GmailDebugStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/gmail-status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch Gmail status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Gmail Debug Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-red-800">Gmail Debug Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">Failed to load status</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (!status.authenticated) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (!status.gmail_tokens_stored) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  };

  const getStatusColor = () => {
    if (!status.authenticated) return 'bg-red-50 border-red-200';
    if (!status.gmail_tokens_stored) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <Card className={getStatusColor()}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getStatusIcon()}
          Gmail Connection Debug
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStatus}
            className="ml-auto p-1 h-6 w-6"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!status.authenticated ? (
          <>
            <div className="text-sm text-red-700">Not authenticated</div>
            <Button
              size="sm"
              onClick={() => window.location.href = '/auth/google'}
              className="w-full"
            >
              Connect Gmail
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-1 text-xs">
              <div>User: {status.user_email}</div>
              <div className="flex items-center gap-2">
                <span>Tokens:</span>
                <Badge variant={status.gmail_tokens_stored ? 'success' : 'destructive'}>
                  {status.gmail_tokens_stored ? 'Stored' : 'Missing'}
                </Badge>
              </div>
              {status.gmail_tokens_stored && (
                <>
                  <div>Token Length: {status.token_length}</div>
                  <div>Expires: {status.token_expires ? new Date(status.token_expires).toLocaleDateString() : 'Never'}</div>
                  <div>Refresh Token: {status.has_refresh_token ? 'Yes' : 'No'}</div>
                  <div>Scope: {status.token_scope}</div>
                </>
              )}
              {status.token_error && (
                <div className="text-red-600">Error: {status.token_error}</div>
              )}
            </div>
            {!status.gmail_tokens_stored && (
              <Button
                size="sm"
                onClick={() => window.location.href = '/auth/google'}
                className="w-full"
              >
                Reconnect Gmail
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
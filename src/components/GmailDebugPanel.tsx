'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

interface OAuthConfig {
  oauth_url?: string;
  oauth_error?: any;
  oauth_scopes?: string;
  redirect_uri?: string;
  environment?: any;
  debug_info?: any;
}

export function GmailDebugPanel() {
  const { user, signInWithGoogle, connectGmail } = useAuth();
  const [status, setStatus] = useState<GmailDebugStatus | null>(null);
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Fetch both endpoints in parallel
      const [statusResponse, configResponse] = await Promise.all([
        fetch('/api/debug/gmail-status'),
        fetch('/api/debug/oauth-config')
      ]);

      const statusData = await statusResponse.json();
      const configData = await configResponse.json();

      setStatus(statusData);
      setOauthConfig(configData);
    } catch (error) {
      console.error('Failed to fetch debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testGmailDirect = async () => {
    try {
      const response = await fetch('/api/briefs/enhanced?use_real_data=true');
      const data = await response.json();
      console.log('📧 Brief generation test:', data);
      alert(`Brief test result: ${data.dataSource || 'unknown'} - Check console for details`);
    } catch (error) {
      console.error('Brief test failed:', error);
      alert('Brief test failed - check console');
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
    if (!user) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (!status?.gmail_tokens_stored) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  };

  const getStatusColor = () => {
    if (!user) return 'bg-red-50 border-red-200';
    if (!status?.gmail_tokens_stored) return 'bg-yellow-50 border-yellow-200';
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
      <CardContent className="space-y-3">
        {!user ? (
          <>
            <div className="text-sm text-red-700">Not authenticated</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={signInWithGoogle}
                className="flex-1"
              >
                Supabase OAuth
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={connectGmail}
                className="flex-1"
              >
                Direct Gmail
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1 text-xs">
              <div><strong>User:</strong> {user?.email || status?.user_email}</div>
              <div className="flex items-center gap-2">
                <span><strong>Tokens:</strong></span>
                <Badge variant={status?.gmail_tokens_stored ? 'success' : 'destructive'}>
                  {status?.gmail_tokens_stored ? 'Stored' : 'Missing'}
                </Badge>
              </div>
              {status?.gmail_tokens_stored && (
                <>
                  <div><strong>Token Length:</strong> {status.token_length}</div>
                  <div><strong>Expires:</strong> {status.token_expires ? new Date(status.token_expires).toLocaleDateString() : 'Never'}</div>
                  <div><strong>Refresh Token:</strong> {status.has_refresh_token ? 'Yes' : 'No'}</div>
                  <div><strong>Scope:</strong> {status.token_scope}</div>
                </>
              )}
              {status?.token_error && (
                <div className="text-red-600"><strong>Error:</strong> {status.token_error}</div>
              )}
            </div>

            {/* OAuth Configuration Debug */}
            {oauthConfig && (
              <div className="border-t pt-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="p-1 h-6 text-xs"
                >
                  {expanded ? 'Hide' : 'Show'} OAuth Config
                </Button>
                {expanded && (
                  <div className="mt-2 space-y-1 text-xs bg-gray-50 p-2 rounded">
                    <div><strong>Gmail Scope:</strong> {oauthConfig.debug_info?.gmail_scope_included ? '✅' : '❌'}</div>
                    <div><strong>Offline Access:</strong> {oauthConfig.debug_info?.offline_access ? '✅' : '❌'}</div>
                    <div><strong>Client ID:</strong> {oauthConfig.environment?.client_id_preview}</div>
                    <div><strong>Redirect URI:</strong> {oauthConfig.redirect_uri}</div>
                    {oauthConfig.oauth_error && (
                      <div className="text-red-600"><strong>OAuth Error:</strong> {oauthConfig.oauth_error.message}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!status?.gmail_tokens_stored && (
                <div className="flex gap-1 flex-1">
                  <Button
                    size="sm"
                    onClick={signInWithGoogle}
                    className="flex-1 text-xs"
                  >
                    Supabase
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={connectGmail}
                    className="flex-1 text-xs"
                  >
                    Direct
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={testGmailDirect}
                className={!status?.gmail_tokens_stored ? 'flex-1' : 'w-full'}
              >
                Test Brief
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
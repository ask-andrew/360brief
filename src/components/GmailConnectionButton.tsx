'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TokenData {
  access_token: string;
  expires_at: string | null;
  provider: string;
}

export default function GmailConnectionButton() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkGmailConnection();
  }, []);

  const checkGmailConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_tokens')
        .select('access_token, expires_at, provider')
        .eq('user_id', session.user.id)
        .eq('provider', 'google')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Gmail connection:', error);
        setIsConnected(false);
      } else if (data) {
        // Check if token is expired
        const isExpired = data.expires_at && new Date(data.expires_at) <= new Date();
        setIsConnected(!isExpired);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Redirect to Gmail OAuth flow using the correct app router path
      window.location.href = '/api/auth/gmail/authorize?redirect=' + encodeURIComponent(window.location.href);
    } catch (error) {
      console.error('Error initiating Gmail connection:', error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', session.user.id)
        .eq('provider', 'google');

      if (error) {
        console.error('Error disconnecting Gmail:', error);
        return;
      }

      setIsConnected(false);
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 border rounded-lg bg-gray-50">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-600">Checking Gmail connection...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">Gmail Connected</p>
            <p className="text-sm text-green-700">Your email data is being processed</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDisconnect}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <div>
          <p className="font-medium text-yellow-900">Gmail Not Connected</p>
          <p className="text-sm text-yellow-700">Connect Gmail to see email analytics and briefs</p>
        </div>
      </div>
      <Button 
        onClick={handleConnect}
        disabled={isConnecting}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Connect Gmail
          </>
        )}
      </Button>
    </div>
  );
}

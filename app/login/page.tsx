"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { Provider } from '@supabase/supabase-js';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const { handleLogin, isLoading, error, setError } = useAuth();
  
  // Handle OAuth errors from the URL
  useEffect(() => {
    const error = searchParams?.get('error');
    if (error) {
      setError(decodeURIComponent(error));
    }
  }, [searchParams, setError]);

  const providers: { id: Provider; name: string; icon?: string }[] = [
    { id: 'google', name: 'Google', icon: 'G' },
    { id: 'github', name: 'GitHub', icon: 'GitHub' },
    { id: 'slack', name: 'Slack', icon: 'Slack' },
    { id: 'azure', name: 'Microsoft', icon: 'Windows' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to 360Brief</h1>
          <p className="text-gray-600">Streamline your executive briefings in one place</p>
        </div>
        
        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
            <p className="font-medium">Sign in failed</p>
            <p className="mt-1 text-red-600">{error}</p>
          </div>
        )}
        
        <div className="space-y-3">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              onClick={() => handleLogin(provider.id)}
              className="w-full justify-center gap-2 h-11 text-base"
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">↻</span>
                  <span>Signing in with {provider.name}...</span>
                </>
              ) : (
                <span>Sign in with {provider.name}</span>
              )}
            </Button>
          ))}
        </div>
        
        <p className="text-xs text-center text-gray-500 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GoogleConnectButton } from '@/components/auth/GoogleConnectButton';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { ReadonlyURLSearchParams } from 'next/navigation';

interface LoginPageProps {
  searchParams?: {
    error?: string;
    error_description?: string;
  };
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  const router = useRouter();
  const searchParams = useSearchParams() as ReadonlyURLSearchParams | null;
  const [isLoading, setIsLoading] = useState(false);

  // Handle OAuth errors
  useEffect(() => {
    if (!searchParams) return;
    
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      toast({
        title: 'Authentication Error',
        description: errorDescription || 'An error occurred during authentication',
        variant: 'destructive',
      });
      
      // Clean up the URL
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('error');
      cleanUrl.searchParams.delete('error_description');
      window.history.replaceState({}, '', cleanUrl.toString());
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-500">
                Continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleConnectButton
              variant="outline"
              className="w-full"
              onError={(error) => {
                console.error('Google OAuth error:', error);
                toast({
                  title: 'Authentication Error',
                  description: error.message || 'Failed to sign in with Google',
                  variant: 'destructive',
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

const TEST_USER_EMAIL = 'test@360brief.app';

export default function DevLoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const supabase = createClientComponentClient();
  
  // Check session and redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          router.replace('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkSession();
  }, [router, supabase.auth]);

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200"></div>
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }



  const handleDevLogin = async () => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      // First, clear any existing session
      await supabase.auth.signOut();
      
      // Call the dev login API
      const response = await fetch('/api/dev/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log in');
      }

      // Force a full page reload to ensure all auth state is properly set
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Login failed:', error);
      setLoginError(error.message || 'An error occurred during login');
      toast({
        title: 'Login Failed',
        description: error.message || 'An error occurred during login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            360Brief
          </h1>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Development Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This is a development-only login page
          </p>
        </div>
        
        <div className="space-y-6">
          <Button
            onClick={handleDevLogin}
            disabled={isLoading}
            className="w-full py-2 px-4"
            variant="default"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Continue as Test User'
            )}
          </Button>
          
          {loginError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Login failed</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{loginError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>This will sign you in as a test user with email: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{TEST_USER_EMAIL}</code></p>
            <p className="mt-2 text-xs text-gray-500">
              Note: This page is only available in development mode
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Go to production login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

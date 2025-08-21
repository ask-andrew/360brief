'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useGoogleOAuth } from '@/hooks/use-google-oauth';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  const { startOAuthFlow, loading: oauthLoading } = useGoogleOAuth({
    onSuccess: () => {
      toast({
        title: 'Successfully signed in!',
        description: 'Welcome back!',
      });
    },
    onError: (error) => {
      setError(error.message);
      toast({
        title: 'Authentication error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle OAuth errors from URL params
  useEffect(() => {
    const error = searchParams?.get('error');
    const errorDescription = searchParams?.get('error_description');

    if (error === 'OAuthSignin') {
      setError('Error signing in with Google. Please try again.');
    } else if (error === 'OAuthCallback') {
      setError(errorDescription || 'Error during authentication.');
    } else if (error === 'OAuthAccountNotLinked') {
      setError('This email is already registered with a different provider.');
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    const returnUrl = window.location.search.includes('returnUrl=') 
      ? new URLSearchParams(window.location.search).get('returnUrl')
      : '/dashboard';
    
    localStorage.setItem('sb-redirect-to', returnUrl || '/dashboard');
    await startOAuthFlow(returnUrl || '/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to 360Brief</h1>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={handleGoogleLogin}
          disabled={oauthLoading}
          className="w-full gap-2"
          variant="outline"
        >
          <GoogleIcon />
          {oauthLoading ? 'Signing in...' : 'Continue with Google'}
        </Button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
        <path
          fill="#4285F4"
          d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.28426 53.749 C -8.52426 55.229 -9.21677 56.479 -10.0808 57.329 L -10.0808 60.689 L -5.70977 60.689 C -3.56477 58.689 -2.704 55.509 -2.704 51.509 C -2.703 51.009 -2.753 50.509 -2.814 50.009 L -3.264 51.509 Z"
        />
        <path
          fill="#34A853"
          d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.715 60.689 L -10.086 57.329 C -11.146 58.049 -12.545 58.489 -14.054 58.489 C -16.925 58.489 -19.335 56.599 -20.065 53.959 L -24.494 53.959 L -24.494 57.509 C -22.495 61.409 -18.985 63.239 -14.754 63.239 Z"
        />
        <path
          fill="#FBBC05"
          d="M -20.065 53.959 C -20.335 53.029 -20.485 52.039 -20.485 50.999 C -20.485 49.959 -20.335 48.969 -20.065 48.039 L -20.065 44.489 L -24.494 44.489 C -25.564 46.559 -26.094 48.869 -26.094 51.009 C -26.094 53.149 -25.564 55.459 -24.494 57.529 L -20.065 53.959 Z"
        />
        <path
          fill="#EA4335"
          d="M -14.754 43.509 C -12.984 43.509 -11.404 44.059 -10.054 45.089 L -6.734 41.77 C -8.804 39.89 -11.514 38.759 -14.754 38.759 C -18.985 38.759 -22.495 40.589 -24.494 44.489 L -20.065 48.039 C -19.335 45.399 -16.925 43.509 -14.754 43.509 Z"
        />
      </g>
    </svg>
  );
}

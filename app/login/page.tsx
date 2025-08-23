'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { Loader2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, isLoading: authLoading } = useAuth();

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
    try {
      setIsLoading(true);
      setError(null);
      
      // This will redirect to Google's OAuth page
      await signIn();
      
      // If we get here, there was no error but the page didn't redirect
      // This might happen if the popup was blocked or there was a race condition
      toast.info('Redirecting to Google...', {
        description: 'Please complete the sign-in process in the popup window.',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Failed to sign in. Please try again.';
      setError(errorMessage);
      toast.error('Authentication error', {
        description: errorMessage,
      });
    } finally {
      // Don't set loading to false here as we're redirecting
      // If there's an error, the error state will be handled by the error boundary
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-lg bg-primary p-3 text-primary-foreground">
            <Briefcase className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to continue to your dashboard
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading || authLoading}
            className="w-full"
            variant="outline"
          >
            {(isLoading || authLoading) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <GoogleIcon className="mr-2 h-4 w-4" />
                Continue with Google
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface GoogleIconProps {
  className?: string;
}

function GoogleIcon({ className }: GoogleIconProps) {
  return (
    <svg className={className || 'h-5 w-5'} viewBox="0 0 24 24">
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

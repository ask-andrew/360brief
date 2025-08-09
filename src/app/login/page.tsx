'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GoogleConnectButton } from '@/components/auth/GoogleConnectButton';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface LoginPageProps {
  searchParams?: {
    error?: string;
    error_description?: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, loading: authLoading, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth errors
  useEffect(() => {
    const error = searchParams?.get('error');
    const errorDescription = searchParams?.get('error_description');

    if (error === 'OAuthSignin') {
      setError('There was an error signing in with Google. Please try again.');
      toast({
        title: 'Error signing in',
        description: 'There was an error signing in with Google. Please try again.',
        variant: 'destructive',
      });
    } else if (error === 'OAuthCallback') {
      const message = errorDescription || 'There was an error during authentication.';
      setError(message);
      toast({
        title: 'Authentication error',
        description: message,
        variant: 'destructive',
      });
    } else if (error === 'OAuthAccountNotLinked') {
      setError('This email is already registered with a different provider.');
      toast({
        title: 'Account not linked',
        description: 'This email is already registered with a different provider.',
        variant: 'destructive',
      });
    } else if (error === 'EmailSignin') {
      setError('There was an error sending the login email. Please try again.');
      toast({
        title: 'Could not send email',
        description: 'There was an error sending the login email. Please try again.',
        variant: 'destructive',
      });
    } else if (error === 'CredentialsSignin') {
      setError('The email or password you entered is incorrect.');
      toast({
        title: 'Invalid credentials',
        description: 'The email or password you entered is incorrect.',
        variant: 'destructive',
      });
    } else if (error === 'SessionRequired') {
      setError('Please sign in again to continue.');
      toast({
        title: 'Session expired',
        description: 'Please sign in again to continue.',
        variant: 'default',
      });
    } else if (error === 'OAuthCreateAccount') {
      setError('Unable to create user account. Please try again.');
      toast({
        title: 'Account creation failed',
        description: 'Unable to create user account. Please try again.',
        variant: 'destructive',
      });
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
          {/* Email/password form */}
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setIsLoading(true);
              setError(null);
              try {
                const { error } = await signIn(email, password);
                if (error) {
                  setError(error.message);
                  toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
                  return;
                }
                const next = searchParams?.get('next') || '/dashboard';
                router.push(next);
              } catch (err: any) {
                setError(err?.message || 'Failed to sign in');
                toast({ title: 'Login failed', description: err?.message || 'Failed to sign in', variant: 'destructive' });
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

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
              disabled={!user}
              onError={(error) => {
                console.error('Google OAuth error:', error);
                toast({
                  title: 'Authentication Error',
                  description: error.message || 'Failed to sign in with Google',
                  variant: 'destructive',
                });
              }}
            />
            {!user && (
              <p className="mt-2 text-center text-sm text-gray-500">
                Sign in with email/password first, then connect Google.
              </p>)
            }
          </div>
        </div>
      </div>
    </div>
  );
}

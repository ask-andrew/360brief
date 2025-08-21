'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

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
  const ssoDomain = process.env.NEXT_PUBLIC_SSO_DOMAIN;
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

  // If already authenticated, leave /login immediately
  useEffect(() => {
    if (user) {
      const redirectedFrom = searchParams?.get('redirectedFrom');
      const target = redirectedFrom && redirectedFrom !== '/login' ? redirectedFrom : (searchParams?.get('next') || '/dashboard');
      router.replace(target);
    }
  }, [user, router, searchParams]);

  const handleSSOSignIn = async () => {
    try {
      if (!ssoDomain) {
        toast({ title: 'SSO not configured', description: 'Set NEXT_PUBLIC_SSO_DOMAIN to enable Enterprise SSO.', variant: 'destructive' });
        return;
      }
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithSSO({
        domain: ssoDomain,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      } as any);
      if (error) {
        console.error('SSO sign-in error:', error);
        toast({ title: 'SSO sign-in failed', description: error.message, variant: 'destructive' });
      }
    } catch (e: any) {
      console.error('SSO sign-in exception:', e);
      toast({ title: 'SSO sign-in failed', description: e.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear any existing state
      localStorage.removeItem('oauth_state');
      
      // Generate a secure random state parameter
      const state = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      // Store state in both localStorage and sessionStorage for redundancy
      localStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_state', state);
      
      // Set the redirect URL - use the OAuth callback page
      const redirectTo = new URL('/oauth-callback.html', window.location.origin);
      
      console.log('Initiating Google OAuth with state:', state);
      console.log('Redirect URL:', redirectTo.toString());
      
      // Start the OAuth flow with PKCE
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',  // Use consent to ensure we get a refresh token
            state: state,
            include_granted_scopes: 'true',
            redirect_uri: redirectTo.toString()
          },
          scopes: 'openid profile email',
          skipBrowserRedirect: true
        },
      });
      
      if (error) {
        console.error('OAuth initialization error:', error);
        // Clean up on error
        localStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_state');
        throw error;
      }
      
      // Redirect manually to ensure PKCE flow works
      if (data?.url) {
        console.log('Redirecting to OAuth provider');
        window.location.href = data.url;
      } else {
        throw new Error('Failed to get OAuth URL');
      }
      
    } catch (e: any) {
      console.error('Google sign-in error:', e);
      // Clear the state cookie on error
      document.cookie = 'oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      const errorMessage = e.error_description || e.message || 'Failed to initiate Google sign in';
      setError(errorMessage);
      toast({ 
        title: 'Google sign-in failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                // Wait briefly for session to be established on the client
                const redirectedFrom = searchParams?.get('redirectedFrom');
                const target = redirectedFrom && redirectedFrom !== '/login' ? redirectedFrom : (searchParams?.get('next') || '/dashboard');

                const waitForUser = async (timeoutMs = 3000) => {
                  const start = Date.now();
                  while (Date.now() - start < timeoutMs) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) return true;
                    await new Promise(r => setTimeout(r, 100));
                  }
                  return false;
                };

                const gotUser = await waitForUser();
                if (!gotUser) {
                  console.warn('Login: session not yet visible, proceeding to navigate');
                }
                router.replace(target);
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
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading || authLoading}>
              Continue with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

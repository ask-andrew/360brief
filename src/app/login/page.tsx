'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { FaSpinner } from 'react-icons/fa';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading: authLoading, user, signInWithOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const redirectTo = searchParams?.get('redirectTo') || '/dashboard';
      router.replace(redirectTo);
    }
  }, [user, router, searchParams]);

  useEffect(() => {
    const error = searchParams?.get('error');
    const errorDescription = searchParams?.get('error_description');

    if (error) {
      let errorMessage = 'An error occurred during sign in';
      
      switch (error) {
        case 'OAuthSignin':
          errorMessage = 'There was an error signing in with Google. Please try again.';
          break;
        case 'OAuthCallback':
          errorMessage = errorDescription || 'There was an error during authentication.';
          break;
        case 'OAuthAccountNotLinked':
          errorMessage = 'This email is already registered with a different provider.';
          break;
        case 'EmailSignin':
          errorMessage = 'There was an error sending the login email. Please try again.';
          break;
        case 'CredentialsSignin':
          errorMessage = 'The email or password you entered is incorrect.';
          break;
        case 'SessionRequired':
          errorMessage = 'Please sign in again to continue.';
          break;
        case 'OAuthCreateAccount':
          errorMessage = 'Unable to create user account. Please try again.';
          break;
      }

      setError(errorMessage);
      toast({
        title: 'Authentication Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Store the current path to redirect back after login
      const redirectPath = 
        (Array.isArray(searchParams.redirectedFrom) 
          ? searchParams.redirectedFrom[0] 
          : searchParams.redirectedFrom) || '/dashboard';
      
      // Set a cookie with the redirect path that will be read by the callback
      document.cookie = `redirect_after_login=${encodeURIComponent(redirectPath)}; path=/; samesite=lax`;
      
      const { error } = await signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile openid https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
        },
      });
      
      if (error) {
        console.error('Error signing in with Google:', error);
        setError(error.message);
        // Clear the redirect cookie on error
        document.cookie = 'redirect_after_login=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch (err) {
      console.error('Unexpected error during Google sign in:', err);
      setError('An unexpected error occurred. Please try again.');
      // Clear the redirect cookie on error
      document.cookie = 'redirect_after_login=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to 360Brief</h1>
          <p className="text-gray-600">Sign in to access your executive briefing dashboard</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <FaSpinner className="animate-spin h-5 w-5" />
            ) : (
              <FcGoogle className="h-5 w-5" />
            )}
            <span>Continue with Google</span>
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>
          
          <Link
            href="/login/email"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in with Email
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { signInWithOAuth, signOut } from '@/lib/auth/actions';
import { useToast } from '@/components/ui/use-toast';

export default function TestAuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, session, isAuthenticated, loading, error } = useAuthStore();

  const handleSignIn = async () => {
    try {
      toast({
        title: 'Initiating sign in...',
        description: 'Redirecting to Google for authentication',
      });
      
      const result = await signInWithOAuth('google');
      
      if (result?.error) {
        console.error('Sign in error:', result.error);
        throw new Error(result.error);
      }
      
      // If we get here, the sign-in was successful
      toast({
        title: 'Success',
        description: 'Redirecting to your dashboard...',
      });
      
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate sign in';
      
      toast({
        title: 'Sign In Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw new Error(error);
      }
      
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      
      router.push('/login');
      
    } catch (error) {
      console.error('Sign out error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      
      toast({
        title: 'Sign Out Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto bg-card p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
        
        <div className="space-y-6">
          <div className="p-4 border rounded-md">
            <h2 className="font-semibold mb-2">Auth State</h2>
            <pre className="text-sm bg-muted p-3 rounded overflow-auto">
              {JSON.stringify(
                {
                  isAuthenticated,
                  user: user
                    ? {
                        id: user.id,
                        email: user.email,
                        name: user.user_metadata?.name,
                      }
                    : null,
                  session: session
                    ? {
                        expiresAt: session.expires_at,
                        expiresIn: session.expires_in,
                      }
                    : null,
                  loading,
                  error,
                },
                null,
                2
              )}
            </pre>
          </div>

          <div className="flex flex-col space-y-4">
            {!isAuthenticated ? (
              <Button onClick={handleSignIn} className="w-full">
                Sign in with Google
              </Button>
            ) : (
              <Button onClick={handleSignOut} variant="destructive" className="w-full">
                Sign Out
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full"
              disabled={!isAuthenticated}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

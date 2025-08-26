import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase/client';

export function useAuth() {
  const router = useRouter();
  const { 
    user, 
    session, 
    loading: isAuthLoading,
    setUser,
    setError,
    signOut: signOutUser
  } = useAuthStore();

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Sign in function
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.session) throw new Error('No session returned');

      setUser(data.user, data.session);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;
      if (!data.session) throw new Error('No session returned');

      setUser(data.user, data.session);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      signOutUser();
      router.push('/login');
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  return {
    user,
    session,
    loading: isAuthLoading,
    error: useAuthStore(state => state.error),
    isAuthenticated,
    login,
    signUp,
    signOut,
  };
}

export function useProtectedRoute(redirectTo = '/login') {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);
}

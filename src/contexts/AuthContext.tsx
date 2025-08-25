'use client';

import { createContext, useContext, useEffect } from 'react';
import { useAuthStore, type AuthState } from '@/store/auth-store';
import { createClient } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType extends Omit<AuthState, 'setUser'> {
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  setSession: (session: any) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const store = useAuthStore();
  const { setUser, setError, setInitialized, setLoading, loading } = store;
  const supabase = createClient();
  
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sign up');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const setSession = (session: Session | null) => {
    setUser(session?.user ?? null, session);
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('[AuthContext] Initial session error:', error);
          setError(error.message);
        } else {
          setSession(session);
        }
      } catch (err) {
        console.error('[AuthContext] Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (isMounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      if (!isMounted) return;
      setSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setError, setInitialized, setLoading, supabase.auth]);

  const contextValue: AuthContextType = {
    ...store,
    signUp,
    setSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

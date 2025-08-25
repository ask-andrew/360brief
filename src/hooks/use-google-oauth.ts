'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UseGoogleOAuthProps {
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
}

export const useGoogleOAuth = ({ onSuccess, onError }: UseGoogleOAuthProps = {}) => {
  const { setUser, setError, setInitialized, setLoading } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    const init = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) throw error;

        if (session?.user) {
          setUser(session.user, session);
          onSuccess?.(session.user);
        } else {
          setUser(null, null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Google OAuth error:', err);
        setError(err.message || 'Unknown error');
        onError?.(err);
      } finally {
        if (isMounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    // Set up auth state change listener
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      
      if (session?.user) {
        setUser(session.user, session);
        onSuccess?.(session.user);
      } else {
        setUser(null, null);
      }
    });

    authListener = data;
    
    // Initialize auth state
    init();

    // Cleanup function
    return () => {
      isMounted = false;
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  // We're intentionally leaving out the dependency array to avoid unnecessary re-renders
  // The store setters are stable and won't change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

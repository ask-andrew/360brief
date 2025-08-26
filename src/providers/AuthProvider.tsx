'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseClient();
  const { setUser, setLoading, setInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null, session);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null, null);
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('Auth state changed:', event);
      setUser(session?.user ?? null, session);
      
      // Handle specific auth events
      if (event === 'SIGNED_IN') {
        router.refresh(); // Refresh the page to update server components
      } else if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [setUser, setLoading, setInitialized, router]);

  return <>{children}</>;
}

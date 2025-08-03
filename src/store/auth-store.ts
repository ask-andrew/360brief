import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: any;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: any) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clear: () => set({ user: null, session: null, error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage), // or localStorage
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);

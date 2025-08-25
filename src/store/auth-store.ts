import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  isAuthenticated: boolean;
  setUser: (user: any, session: any) => void;
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      loading: true,
      initialized: false,
      error: null,
      isAuthenticated: false,

      setUser: (user, session) =>
        set({
          user,
          session,
          isAuthenticated: !!user,
          loading: false,
          error: null,
        }),

      setInitialized: (initialized) => set({ initialized }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error, loading: false }),

      signOut: () =>
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        }),
    }),
    {
      name: 'auth-store', // localStorage key
    }
  )
);

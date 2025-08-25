import type { User, Session } from '@supabase/supabase-js';

export interface CustomUserAttributes {
  full_name?: string;
  // Add other custom user attributes here
}

export interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  
  // Derived state
  isAuthenticated: boolean;
}

import { supabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { CustomUserAttributes } from './types';

export const signInWithEmail = async (email: string, password: string): Promise<{ user: User | null; session: Session | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    return { user: null, session: null, error: error as Error };
  }
};

export const signUpWithEmail = async (
  email: string, 
  password: string, 
  userData: CustomUserAttributes
): Promise<{ user: User | null; session: Session | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    
    if (error) throw error;
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    return { user: null, session: null, error: error as Error };
  }
};

export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const getSession = async (): Promise<{ session: Session | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session: data.session, error: null };
  } catch (error) {
    return { session: null, error: error as Error };
  }
};

export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
};

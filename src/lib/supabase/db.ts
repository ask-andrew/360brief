import { Database } from '@/lib/supabase/database.types';
import { createClient } from '@supabase/supabase-js';
import env from '@/lib/env';

if (!env.supabaseUrl || !env.supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  env.supabaseUrl,
  env.supabaseAnonKey
);

// Profile related functions
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
  
  return data;
};

export const updateProfile = async (userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
  
  return data;
};

// User preferences helpers (deprecated here):
// Preferences are managed as a single row per user via /api/user/preferences.
// Use that API route from the client; use server route logic for server operations.
export const getUserPreference = async (_userId: string, _key: string) => {
  throw new Error('getUserPreference is deprecated. Use /api/user/preferences instead.');
};

export const setUserPreference = async (_userId: string, _key: string, _value: any) => {
  throw new Error('setUserPreference is deprecated. Use /api/user/preferences instead.');
};

// Auth related functions
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Error signing in:', error);
    throw error;
  }
  
  return data;
};

export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  
  if (error) {
    console.error('Error signing up:', error);
    throw error;
  }
  
  return data;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  
  if (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
  
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
  
  return true;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
  
  return user;
};

import { Database } from '@/lib/types/database.types';
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

// User preferences related functions
export const getUserPreference = async (userId: string, key: string) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('value')
    .eq('user_id', userId)
    .eq('key', key)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching user preference:', error);
    throw error;
  }
  
  return data?.value;
};

export const setUserPreference = async (userId: string, key: string, value: any) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: userId, key, value },
      { onConflict: 'user_id,key' }
    )
    .select()
    .single();
    
  if (error) {
    console.error('Error setting user preference:', error);
    throw error;
  }
  
  return data;
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

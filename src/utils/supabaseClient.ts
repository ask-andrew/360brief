// src/utils/supabaseClient.ts
import { createClient } from '@/lib/supabase/client';

// Initialize Supabase client using the shared singleton
export const supabase = createClient();

// Helper function to get the current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Helper function to sign out
export const signOut = async () => {
  await supabase.auth.signOut();
  window.location.href = '/login';
};

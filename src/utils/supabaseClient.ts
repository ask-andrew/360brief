// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Validate and format the Supabase URL
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables');
  }
  
  // Ensure URL has proper format
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http')) {
    formattedUrl = `https://${formattedUrl}`;
  }
  
  // Remove any trailing slashes
  formattedUrl = formattedUrl.replace(/\/+$/, '');
  
  try {
    new URL(formattedUrl);
    return formattedUrl;
  } catch (error) {
    throw new Error(`Invalid Supabase URL: ${formattedUrl}. Please check your environment variables.`);
  }
}

// Validate the anon key
function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in environment variables');
  }
  return key.trim();
}

// Initialize Supabase client
export const supabase = (() => {
  try {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
})();

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

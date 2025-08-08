'use client';

import { createClient as createClientSSR } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Simple cookie getter that doesn't try to parse JSON
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
};

// Simple cookie setter
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === 'undefined') return;
  
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}; ${expires}; path=/; samesite=lax${
    process.env.NODE_ENV === 'production' ? '; secure' : ''
  }; httponly`;
};

// Simple cookie remover
const removeCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};

// Create a custom storage adapter
const customStorage = {
  getItem: (key: string) => {
    const value = getCookie(key);
    return value ? decodeURIComponent(value) : null;
  },
  setItem: (key: string, value: string) => {
    setCookie(key, encodeURIComponent(value));
  },
  removeItem: (key: string) => {
    removeCookie(key);
  },
};

// Create a singleton instance of the Supabase client
let supabaseClient: ReturnType<typeof createClientSSR<Database>> | null = null;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key');
  }

  supabaseClient = createClientSSR<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'sb-auth-token',
      flowType: 'pkce',
    },
  });

  return supabaseClient;
}

// Export the singleton instance
export const supabase = createClient();

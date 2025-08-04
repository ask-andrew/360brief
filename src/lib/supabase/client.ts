import { createClient } from '@supabase/supabase-js';
import { secureLocalStorage } from '@/lib/security/token-storage';
import env from '@/config/env';

// Get and validate Supabase URL
const getSupabaseUrl = (): string => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL.trim();
  
  if (!url) {
    throw new Error('Missing Supabase URL in environment configuration');
  }
  
  try {
    // Ensure the URL is valid and has the correct protocol
    const urlObj = new URL(url);
    if (!urlObj.protocol.startsWith('http')) {
      throw new Error('URL must use http or https protocol');
    }
    return url;
  } catch (error) {
    console.error('Invalid Supabase URL:', url);
    throw new Error(`Invalid Supabase URL: ${url}. Please check your .env.local file.`);
  }
};

// Get configuration
const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anon key in environment configuration');
}

// Create a custom storage adapter that uses our secure storage
const customStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return secureLocalStorage?.getItem(key) || null;
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    secureLocalStorage?.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    secureLocalStorage?.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: customStorage,
    storageKey: 'sb-360brief-auth-token',
  },
});

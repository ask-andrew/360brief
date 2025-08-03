import { createClient } from '@supabase/supabase-js';
import { secureLocalStorage } from '@/lib/security/token-storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

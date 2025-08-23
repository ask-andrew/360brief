import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Types for cookie handling
type CookieOptions = {
  name: string;
  value: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
};

type ServerCookies = {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: Omit<CookieOptions, 'name' | 'value'>) => void;
};

// Create the main Supabase client for client-side usage
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development',
  },
  global: {
    headers: {
      'X-Client-Info': '360brief-web',
    },
  },
});

// Create a server-side Supabase client with cookie handling
function createServerSupabaseClient(cookies: ServerCookies) {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key: string) => {
          const cookie = cookies.get(key);
          return cookie?.value || null;
        },
        setItem: (key: string, value: string) => {
          const options = {
            name: key,
            value,
            path: '/',
            sameSite: 'lax' as const,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
          };
          cookies.set(key, value, options);
        },
        removeItem: (key: string) => {
          const options = {
            name: key,
            value: '',
            path: '/',
            maxAge: 0,
          };
          cookies.set(key, '', options);
        },
      },
    },
  });
}

export { supabaseClient as supabase, createServerSupabaseClient };
export default supabaseClient;

'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

// IMPORTANT: Next.js only inlines env when referenced directly, e.g. process.env.NEXT_PUBLIC_*
// Do NOT use dynamic indexing like process.env[key] in client code.
const PUBLIC_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

function getEnvVar<K extends keyof typeof PUBLIC_ENV>(key: K): string {
  const value = PUBLIC_ENV[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Remove custom cookie handler: rely on Supabase default localStorage in browser.

/**
 * Create a Supabase client for browser usage
 */
// Create a single instance of the browser client
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  // Return existing client if already created
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (typeof window === 'undefined') {
    // Server-side: return a dummy client
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  // Client-side: create and cache the client with proper OAuth configuration
  supabaseClient = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: true,
        storage: {
          getItem: (key) => {
            if (typeof window === 'undefined') return null;
            try {
              const item = localStorage.getItem(key);
              return item ? JSON.parse(item) : null;
            } catch (error) {
              console.error('Error reading from localStorage:', error);
              return null;
            }
          },
          setItem: (key, value) => {
            if (typeof window === 'undefined') return;
            try {
              localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
              console.error('Error writing to localStorage:', error);
            }
          },
          removeItem: (key) => {
            if (typeof window === 'undefined') return;
            try {
              localStorage.removeItem(key);
            } catch (error) {
              console.error('Error removing from localStorage:', error);
            }
          },
        },
      },
      global: {
        headers: {
          'X-Client-Info': '360brief-web',
        },
      },
    }
  );
  
  // Log OAuth state changes for debugging
  if (typeof window !== 'undefined') {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
    });
  }

  return supabaseClient;
}

// Create a single supabase client for client-side usage
export const supabase = createClient();

// Create a server-side client
export function createServerClient() {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables');
  }
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      // No-op cookies on server variant here; real server routes should use @supabase/ssr server helpers.
    }
  );
}

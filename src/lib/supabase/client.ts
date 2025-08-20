'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

declare global {
  interface Window {
    __SUPABASE_CLIENT__?: ReturnType<typeof createBrowserClient>;
  }
}

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

// Create a single supabase client for client-side usage, ensuring it's a singleton.
// We use a global variable to ensure the instance is created only once
// across hot reloads in development.
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseClient() {
  // In development, use window to persist the client across hot reloads
  if (typeof window !== 'undefined' && window.__SUPABASE_CLIENT__) {
    return window.__SUPABASE_CLIENT__;
  }

  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          debug: process.env.NODE_ENV === 'development',
        },
        cookies: {
          // Client-side cookie handling for Supabase auth
          get(name: string) {
            if (typeof document === 'undefined') return null;
            
            const cookie = document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${name}=`))
              ?.split('=')[1];
            
            return cookie ? decodeURIComponent(cookie) : null;
          },
          set(name: string, value: string, options: any) {
            if (typeof document === 'undefined') return;
            
            const secure = window.location.protocol === 'https:' ? 'Secure; ' : '';
            const sameSite = 'SameSite=Lax; ';
            const path = 'Path=/; ';
            const expires = options.maxAge 
              ? `Expires=${new Date(Date.now() + options.maxAge * 1000).toUTCString()}; ` 
              : '';
            
            document.cookie = `${name}=${encodeURIComponent(value)}; ${path}${expires}${secure}${sameSite}${secure}HttpOnly`;
          },
          remove(name: string, options: any) {
            if (typeof document === 'undefined') return;
            
            document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${
              options.domain ? `Domain=${options.domain};` : ''
            }`;
          },
        },
      }
    );

    // Store in window for development hot reloading
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      window.__SUPABASE_CLIENT__ = supabaseClient;
    }
  }
  
  return supabaseClient;
}

// Export the singleton instance
export const supabase = getSupabaseClient();

// Create a server-side client
// NOTE: This client is only for specific client components that need to read cookies.
// For server components, you should use the @supabase/ssr helpers directly.
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

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
export function createClient() {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  // Both env vars are required in all environments

  // Use default browser storage (localStorage) and built-in cookie handling.
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
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

'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

// Fallback values for development
const FALLBACKS = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
} as const;

type EnvKey = keyof typeof FALLBACKS;

/**
 * Safely gets an environment variable with fallback for development
 */
function getEnvVar(key: EnvKey): string {
  // In Next.js, NEXT_PUBLIC_* vars are inlined into client bundles via process.env
  const value = process.env[key as string];
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return FALLBACKS[key];
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

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Running in development mode with fallback Supabase credentials');
    } else {
      throw new Error('Missing required Supabase environment variables');
    }
  }

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

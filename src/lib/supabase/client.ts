'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

// Fallback values for development
const FALLBACKS = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
} as const;
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift() || '';
        return cookieValue;
      }
      
      return '';
    },
    set: (name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: string } = {}) => {
      if (typeof document === 'undefined') return;
      
      let cookieString = `${name}=${value}`;
      
      // Add options
      if (options.path) cookieString += `; Path=${options.path}`;
      if (options.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
      if (options.domain) cookieString += `; Domain=${options.domain}`;
      if (options.secure) cookieString += '; Secure';
      if (options.httpOnly) cookieString += '; HttpOnly';
      if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
      
      document.cookie = cookieString;
    },
    remove: (name: string, options: { path?: string; domain?: string } = {}) => {
      if (typeof document === 'undefined') return;
      
      let cookieString = `${name}=; Max-Age=-99999999`;
      if (options.path) cookieString += `; Path=${options.path}`;
      if (options.domain) cookieString += `; Domain=${options.domain}`;

type EnvKey = keyof typeof FALLBACKS;

/**
 * Safely gets an environment variable with fallback for development
 */
function getEnvVar(key: EnvKey): string {
  // Server-side: use process.env
  if (typeof window === 'undefined') {
    const value = process.env[key];
    if (!value && process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || FALLBACKS[key];
  }
  
  // Client-side: use window.ENV or fallback
  // @ts-ignore - This is a valid pattern in Next.js
  return window.ENV?.[key] || FALLBACKS[key];
}

/**
 * Custom cookie handler for Supabase auth
 */
function createCookieHandler() {
  return {
    getItem: (key: string): string | null => {
      if (typeof document === 'undefined') return null;
      return document.cookie
        .split('; ')
        .find(row => row.startsWith(`${key}=`))
        ?.split('=')[1] || null;
    },
    setItem: (key: string, value: string) => {
      if (typeof document === 'undefined') return;
      document.cookie = `${key}=${value}; path=/; samesite=lax; secure`;
    },
    removeItem: (key: string) => {
      if (typeof document === 'undefined') return;
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  };
}

/**
 * Create a Supabase client for browser usage
 */
export function createClient() {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const cookieHandler = createCookieHandler();
  
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Running in development mode with fallback Supabase credentials');
    } else {
      throw new Error('Missing required Supabase environment variables');
    }
  }
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'sb-auth-token',
        storage: {
          getItem: (key: string) => {
            return cookieHandler.get(key);
          },
          setItem: (key: string, value: string) => {
            cookieHandler.set(key, value, {
              path: '/',
              maxAge: 60 * 60 * 24 * 7, // 1 week
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true
            });
          },
          removeItem: (key: string) => {
            cookieHandler.remove(key, { path: '/' });
          }
        }
      },
      cookies: {
        get: (name: string) => cookieHandler.get(name),
        set: (name: string, value: string, options: any) => {
          cookieHandler.set(name, value, {
            path: options?.path || '/',
            maxAge: options?.lifetime,
            sameSite: options?.sameSite || 'lax',
            secure: options?.secure ?? process.env.NODE_ENV === 'production',
            httpOnly: true,
            domain: options?.domain
          });
        },
        remove: (name: string, options: any) => {
          cookieHandler.remove(name, {
            path: options?.path || '/',
            domain: options?.domain
          });
        }
      }
    }
  );
}

// Create a single supabase client for client-side usage
export const supabase = createClient();

// Create a server-side client
export function createServerClient() {
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get() {
          return '';
        },
        set() {},
        remove() {},
      },
    }
  );
}

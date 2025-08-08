'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

type CookieOptions = {
  path?: string;
  maxAge?: number;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
};

interface CookieHandler {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string, options?: CookieOptions) => void;
  removeItem: (key: string, options?: { path?: string; domain?: string }) => void;
}

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
  // Server-side: use process.env
  if (typeof window === 'undefined') {
    const value = process.env[key];
    if (!value && process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || FALLBACKS[key];
  }
  
  // Client-side: use window.ENV or fallback
  const windowWithEnv = window as unknown as { ENV?: Record<string, string> };
  return windowWithEnv.ENV?.[key] || FALLBACKS[key];
}

/**
 * Custom cookie handler for Supabase auth
 */
function createCookieHandler(): CookieHandler {
  return {
    getItem: (key: string): string | null => {
      if (typeof document === 'undefined') return null;
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${key}=`));
      
      return cookie ? cookie.split('=')[1] : null;
    },
    setItem: (key: string, value: string, options: CookieOptions = {}): void => {
      if (typeof document === 'undefined') return;
      
      let cookieString = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      
      // Add options
      if (options.path) cookieString += `; Path=${options.path}`;
      if (options.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
      if (options.domain) cookieString += `; Domain=${options.domain}`;
      if (options.secure) cookieString += '; Secure';
      if (options.httpOnly) cookieString += '; HttpOnly';
      if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
      
      document.cookie = cookieString;
    },
    removeItem: (key: string, options: { path?: string; domain?: string } = {}): void => {
      if (typeof document === 'undefined') return;
      
      let cookieString = `${encodeURIComponent(key)}=; Max-Age=-99999999`;
      if (options.path) cookieString += `; Path=${options.path}`;
      if (options.domain) cookieString += `; Domain=${options.domain}`;
      
      document.cookie = cookieString;
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
        storage: cookieHandler
      },
      cookies: {
        get: (name: string) => cookieHandler.getItem(name),
        set: (name: string, value: string, options: any) => {
          cookieHandler.setItem(name, value, {
            path: options?.path || '/',
            maxAge: options?.lifetime,
            sameSite: options?.sameSite || 'lax',
            secure: options?.secure ?? process.env.NODE_ENV === 'production',
            httpOnly: true,
            domain: options?.domain
          });
        },
        remove: (name: string, options: any) => {
          cookieHandler.removeItem(name, {
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
      cookies: {
        get: () => '',
        set: () => {},
        remove: () => {}
      }
    }
  );
}

// Development authentication utilities that work with Supabase

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const DEV_SESSION_KEY = 'dev-session';
const DEV_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const DEV_USER_EMAIL = 'dev@example.com';

export interface DevSession {
  isAuthenticated: boolean;
  userId: string;
  email: string;
}

/**
 * Checks if we're in a development environment with dev auth enabled
 */
function isDevEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return process.env.NODE_ENV === 'development' && 
         process.env.NEXT_PUBLIC_DEV_AUTH_ENABLED === 'true';
}

/**
 * Checks if we have a valid development session
 */
export function isDevSession(): boolean {
  if (!isDevEnvironment()) return false;
  if (typeof window === 'undefined') return false;
  
  // Check if we have a session in localStorage
  return window.localStorage.getItem(DEV_SESSION_KEY) === 'true';
}

/**
 * Gets the current development session
 */
export function getDevSession(): DevSession | null {
  if (!isDevEnvironment()) return null;
  if (typeof window === 'undefined') return null;
  
  if (!isDevSession()) return null;
  
  return {
    isAuthenticated: true,
    userId: DEV_USER_ID,
    email: DEV_USER_EMAIL
  };
}

/**
 * Sets up a development session
 */
export function setDevSession(): void {
  if (!isDevEnvironment()) return;
  if (typeof window === 'undefined') return;
  
  // Store the dev session flag
  window.localStorage.setItem(DEV_SESSION_KEY, 'true');
  
  // Also set a cookie for server-side usage
  document.cookie = `${DEV_SESSION_KEY}=true; path=/; max-age=86400`; // 24 hours
}

/**
 * Clears the development session
 */
export async function clearDevSession(): Promise<void> {
  if (!isDevEnvironment()) return;
  if (typeof window === 'undefined') return;
  
  // Clear the dev session flag
  window.localStorage.removeItem(DEV_SESSION_KEY);
  
  // Clear the cookie
  document.cookie = `${DEV_SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  
  // Sign out from Supabase
  try {
    const supabase = createClientComponentClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out from Supabase:', error);
  }
}

/**
 * Middleware helper to check for dev session in server components
 */
export function getServerDevSession(cookies: { get: (name: string) => { value: string } | undefined }): DevSession | null {
  if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_DEV_AUTH_ENABLED !== 'true') {
    return null;
  }
  
  const devSession = cookies.get(DEV_SESSION_KEY);
  if (!devSession?.value) return null;
  
  return {
    isAuthenticated: true,
    userId: DEV_USER_ID,
    email: DEV_USER_EMAIL
  };
}

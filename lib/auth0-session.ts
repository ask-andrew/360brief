import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Create a single instance of the Auth0 client
export const auth0 = new Auth0Client();

// Type for the user session
export interface Auth0User {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  [key: string]: any;
}

export interface Auth0Session {
  user: Auth0User;
  idToken?: string;
  accessToken?: string;
  accessTokenExpiresAt?: number;
  refreshToken?: string;
}

// Type guard to check if an object is an Auth0User
function isAuth0User(user: any): user is Auth0User {
  return user && typeof user === 'object' && 'sub' in user;
}

/**
 * Get the current session in the app directory
 */
export async function getSession(): Promise<Auth0Session | null> {
  try {
    const session = await auth0.getSession();
    if (!session || !session.user) {
      return null;
    }
    
    // Ensure the user object has the required sub field
    if (!isAuth0User(session.user)) {
      console.error('Invalid user session:', session.user);
      return null;
    }
    
    return session as unknown as Auth0Session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser(): Promise<Auth0User | null> {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Get the access token from the session
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.accessToken || null;
}

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Get the user ID from the session
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.sub || null;
}

/**
 * Check if the access token is expired
 */
export function isTokenExpired(expiresAt?: number): boolean {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt * 1000;
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  
  const roles = session.user['http://schemas.auth0.com/roles'] || [];
  return Array.isArray(roles) ? roles.includes(role) : false;
}

/**
 * Check if the current user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  
  const userRoles = session.user['http://schemas.auth0.com/roles'] || [];
  return Array.isArray(userRoles) ? userRoles.some(role => roles.includes(role)) : false;
}

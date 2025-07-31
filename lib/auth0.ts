import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { NextApiRequest, NextApiResponse } from 'next';

// Create a single instance of the Auth0 client
export const auth0 = new Auth0Client();

// Type for the user session
export interface Auth0User {
  sub: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  [key: string]: any;
}

export interface Auth0Session {
  user: Auth0User;
  idToken?: string;
  accessToken?: string;
  accessTokenExpiresAt?: number;
  refreshToken?: string;
  [key: string]: any;
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
export async function getUser(): Promise<Auth0User | null> {
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
 * Get the user's email address
 */
export async function getUserEmail(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.email || null;
}

/**
 * Check if the user has verified their email
 */
export async function isEmailVerified(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.email_verified || false;
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
  
  // Check both role claim formats
  const roles = [
    ...(session.user['http://schemas.auth0.com/roles'] || []),
    ...(session.user['https://api.360brief.com/roles'] || [])
  ];
  
  return Array.isArray(roles) ? roles.includes(role) : false;
}

/**
 * Check if the current user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  
  // Check both role claim formats
  const userRoles = [
    ...(session.user['http://schemas.auth0.com/roles'] || []),
    ...(session.user['https://api.360brief.com/roles'] || [])
  ];
  
  return Array.isArray(userRoles) ? userRoles.some(role => roles.includes(role)) : false;
}

/**
 * Require authentication for API routes
 */
export function requireAuth(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession();
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    // Add user to the request object for the next handler
    (req as any).user = session.user;
    
    return handler(req, res);
  };
}

/**
 * Require specific scopes for API routes
 */
export function requireScopes(scopes: string[]) {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any>) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const session = await getSession();
      
      if (!session) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authenticated' 
        });
      }
      
      // Check if user has all required scopes
      const userScopes = session['https://api.360brief.com/scopes'] || [];
      const hasAllScopes = scopes.every(scope => 
        userScopes.includes(scope)
      );
      
      if (!hasAllScopes) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }
      
      // Add user to the request object for the next handler
      (req as any).user = session.user;
      
      return handler(req, res);
    };
  };
}

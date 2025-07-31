import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export interface UserSession {
  user: {
    sub: string;
    name?: string;
    email?: string;
    picture?: string;
    access_token: string;
    id_token: string;
    expires_at: number;
  };
}

const SESSION_COOKIE_NAME = 'auth_session' as const;
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Helper function to parse the cookie value
function parseCookieValue(value: string | undefined): UserSession | null {
  if (!value) return null;
  
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    return null;
  }
}

/**
 * Get the current user session from cookies
 */
export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    return sessionCookie ? parseCookieValue(sessionCookie.value) : null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Create a response with the session cookie set
 */
export function createSessionResponse(session: UserSession, redirectUrl?: string): NextResponse {
  const response = redirectUrl 
    ? NextResponse.redirect(new URL(redirectUrl, process.env.APP_BASE_URL || 'http://localhost:3000'))
    : new NextResponse();
  
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: JSON.stringify(session),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  
  return response;
}

/**
 * Create a response that clears the session cookie
 */
export function createClearSessionResponse(redirectUrl?: string): NextResponse {
  const response = redirectUrl 
    ? NextResponse.redirect(new URL(redirectUrl, process.env.APP_BASE_URL || 'http://localhost:3000'))
    : new NextResponse();
  
  // Set the cookie with an expired date to clear it
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    expires: new Date(0), // Expire immediately
    path: '/',
  });
  
  return response;
}

/**
 * Check if a session is valid and not expired
 */
export function isSessionValid(session: UserSession | null): session is UserSession {
  if (!session?.user) return false;
  
  // Check if the session is expired
  const now = Math.floor(Date.now() / 1000);
  return session.user.expires_at > now;
}

/**
 * Get the current session or throw an error if not authenticated
 */
export async function requireSession(): Promise<UserSession> {
  const session = await getSession();
  if (!isSessionValid(session)) {
    throw new Error('No valid session found');
  }
  return session;
}

/**
 * Get the session from a request object (for API routes)
 */
export function getSessionFromRequest(request: Request): UserSession | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookieMap = cookieHeader.split(';').reduce<Record<string, string>>((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      acc[name.trim()] = decodeURIComponent(value);
    }
    return acc;
  }, {});
  
  return parseCookieValue(cookieMap[SESSION_COOKIE_NAME]);
}

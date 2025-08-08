// Simple dev authentication bypass utilities

export const DEV_SESSION_KEY = 'devSession';
const DEV_USER_ID_KEY = 'devUserId';

interface DevSession {
  isAuthenticated: boolean;
  userId: string;
  email: string;
}

export function isDevSession(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DEV_SESSION_KEY) === 'true';
}

export function getDevSession(): DevSession | null {
  if (typeof window === 'undefined') return null;
  
  if (!isDevSession()) return null;
  
  return {
    isAuthenticated: true,
    userId: window.localStorage.getItem(DEV_USER_ID_KEY) || '123e4567-e89b-12d3-a456-426614174000',
    email: 'dev@example.com'
  };
}

export function setDevSession(userId: string = '123e4567-e89b-12d3-a456-426614174000') {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEV_SESSION_KEY, 'true');
  window.localStorage.setItem(DEV_USER_ID_KEY, userId);
}

export function clearDevSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DEV_SESSION_KEY);
  window.localStorage.removeItem(DEV_USER_ID_KEY);
}

// Environment variables that should be exposed to the browser
// These must be prefixed with NEXT_PUBLIC_

const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

// Server-side only environment variables
const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
} as const;

// Type-safe environment variables
type Env = typeof env;
type ServerEnv = typeof serverEnv;

declare global {
  // eslint-disable-next-line no-var
  var ENV: Env;
  // eslint-disable-next-line no-var
  var SERVER_ENV: ServerEnv;
}

// Make environment variables available globally
if (typeof window !== 'undefined') {
  window.ENV = env;
}

// For server-side usage
export function getServerEnv() {
  return serverEnv;
}

export default env;

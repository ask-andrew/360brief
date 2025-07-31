import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { NextRequest } from 'next/server';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';

type User = {
  name?: string;
  email?: string;
  picture?: string;
  sub: string;
  [key: string]: unknown;
};

// Validate required environment variables
const requiredEnvVars = [
  'AUTH0_SECRET',
  'AUTH0_DOMAIN',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'AUTH0_API_AUDIENCE',
  'NEXT_PUBLIC_AUTH0_BASE_URL'
] as const;

const missing = requiredEnvVars.filter(env => !process.env[env]);
if (missing.length > 0) {
  console.error('Missing Auth0 environment variables:', missing);
  throw new Error(`Missing required Auth0 environment variables: ${missing.join(', ')}`);
}

// Create an instance of Auth0Client with your configuration
const auth0 = new Auth0Client({
  // Options are loaded from environment variables by default
  // Ensure necessary environment variables are properly set in .env.local
  // domain: process.env.AUTH0_DOMAIN,
  // clientId: process.env.AUTH0_CLIENT_ID,
  // clientSecret: process.env.AUTH0_CLIENT_SECRET,
  // secret: process.env.AUTH0_SECRET,
  
  // Explicitly set authorization parameters
  authorizationParameters: {
    response_type: 'code',
    scope: 'openid profile email',
    audience: process.env.AUTH0_AUDIENCE, // Optional: Only if using API authorization
  },
  
  // Session configuration (optional)
  session: {
    absoluteDuration: 60 * 60 * 24 * 7, // 7 days
  },
  
  // HTTP settings (optional)
  httpTimeout: 10000, // 10 seconds
});

// Re-export withPageAuthRequired from the client
export { withPageAuthRequired };

/**
 * Get the current user session
 */
export async function getSession(req: NextRequest): Promise<User | null> {
  try {
    const session = await auth0.getSession(req);
    return (session?.user as User) || null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Require authentication for API routes
 * Throws an error if no valid session exists
 */
export async function requireAuth(req: NextRequest): Promise<User> {
  const user = await getSession(req);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

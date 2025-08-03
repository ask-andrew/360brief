/**
 * Auth0 Configuration
 * This configuration uses environment variables for sensitive values.
 * Make sure to set these in your .env file:
 * - NEXT_PUBLIC_AUTH0_DOMAIN
 * - NEXT_PUBLIC_AUTH0_CLIENT_ID
 * - NEXT_PUBLIC_AUTH0_AUDIENCE
 * - NEXT_PUBLIC_AUTH0_BASE_URL
 */

export const auth0Config = {
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "",
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "",
  audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || "",
  redirectUri: process.env.NEXT_PUBLIC_AUTH0_BASE_URL ? `${process.env.NEXT_PUBLIC_AUTH0_BASE_URL}/dashboard` : "http://localhost:3000/dashboard",
  baseUrl: process.env.NEXT_PUBLIC_AUTH0_BASE_URL || "http://localhost:3000"
};

// Validate required environment variables
if (process.env.NODE_ENV !== 'test') {
  const requiredVars = [
    'NEXT_PUBLIC_AUTH0_DOMAIN',
    'NEXT_PUBLIC_AUTH0_CLIENT_ID',
    'NEXT_PUBLIC_AUTH0_AUDIENCE',
    'NEXT_PUBLIC_AUTH0_BASE_URL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('Missing required Auth0 environment variables:', missingVars.join(', '));
  }
}

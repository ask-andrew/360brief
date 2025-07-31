import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { cookies } from 'next/headers';

// Create Auth0 client instance
const auth0 = new Auth0Client({
  // These options are loaded from environment variables by default
  // Ensure necessary environment variables are properly set
  // domain: process.env.AUTH0_DOMAIN,
  // clientId: process.env.AUTH0_CLIENT_ID,
  // clientSecret: process.env.AUTH0_CLIENT_SECRET,
  // appBaseUrl: process.env.NEXT_PUBLIC_AUTH0_BASE_URL,
  // secret: process.env.AUTH0_SECRET,
  authorizationParameters: {
    // In v4, the AUTH0_SCOPE and AUTH0_AUDIENCE environment variables for API authorized applications 
    // are no longer automatically picked up by the SDK. We need to provide the values explicitly.
    scope: process.env.AUTH0_SCOPE || 'openid profile email',
    audience: process.env.AUTH0_AUDIENCE,
  }
});

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth0_session');
    
    if (!sessionCookie) {
      return null;
    }

    // Parse the session data
    const sessionData = JSON.parse(sessionCookie.value);
    
    // Verify the token is still valid
    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt * 1000) {
      return null;
    }

    return {
      user: {
        id: sessionData.id,
        email: sessionData.email,
        name: sessionData.name,
        picture: sessionData.picture,
      },
      accessToken: sessionData.accessToken,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export { auth0 };

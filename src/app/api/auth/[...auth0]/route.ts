import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Helper to generate a secure random string
function generateRandomString(length: number = 64): string {
  return randomBytes(length).toString('hex');
}

// Helper to generate code challenge for PKCE
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to base64url encoding (43 characters for SHA256)
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function GET(request: NextRequest) {
  try {
    const { pathname, searchParams } = new URL(request.url);
    const match = pathname.match(/\/api\/auth\/(.*)/);
    const routeSegment = match?.[1] || '';

    // Handle login
    if (routeSegment === 'login') {
      // Generate PKCE code verifier and challenge
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      console.log('PKCE Debug:', { codeVerifier, codeChallenge, length: codeChallenge?.length || 0 });
      
      // Create the authorization URL
      const authUrl = new URL(`https://${process.env.AUTH0_DOMAIN}/authorize`);
      authUrl.searchParams.set('client_id', process.env.AUTH0_CLIENT_ID!);
      authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_AUTH0_BASE_URL}/api/auth/callback`);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid profile email');
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      
      // Add any additional parameters
      if (process.env.AUTH0_AUDIENCE) {
        authUrl.searchParams.set('audience', process.env.AUTH0_AUDIENCE);
      }
      
      // Create a response that sets the cookie and redirects
      const response = NextResponse.redirect(authUrl.toString());
      
      // Set the code verifier in a secure, HTTP-only cookie
      response.cookies.set({
        name: 'code_verifier',
        value: codeVerifier,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 10, // 10 minutes
      });
      
      return response;
    }
    
    // Handle callback
    if (routeSegment === 'callback') {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      if (error) {
        console.error('Auth0 callback error:', error, searchParams.get('error_description'));
        return NextResponse.redirect(new URL('/auth/error', request.url));
      }
      
      if (!code) {
        console.error('No code in callback');
        return NextResponse.redirect(new URL('/auth/error', request.url));
      }
      
      // Get the code verifier from the cookie
      const codeVerifier = request.cookies.get('code_verifier')?.value;
      if (!codeVerifier) {
        console.error('No code verifier in cookies');
        return NextResponse.redirect(new URL('/auth/error', request.url));
      }
      
      // Exchange the authorization code for tokens
      const tokenUrl = `https://${process.env.AUTH0_DOMAIN}/oauth/token`;
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_AUTH0_BASE_URL}/api/auth/callback`,
          code_verifier: codeVerifier,
        }),
      });
      
      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', await tokenResponse.text());
        return NextResponse.redirect(new URL('/auth/error', request.url));
      }
      
      const tokens = await tokenResponse.json();
      
      // Create a response that redirects to the dashboard
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      
      // Set the access token in a secure, HTTP-only cookie
      response.cookies.set({
        name: 'access_token',
        value: tokens.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: tokens.expires_in || 3600, // Default to 1 hour if not specified
      });
      
      // Set the refresh token in a secure, HTTP-only cookie if available
      if (tokens.refresh_token) {
        response.cookies.set({
          name: 'refresh_token',
          value: tokens.refresh_token,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
      
      // Clear the code verifier cookie
      response.cookies.delete('code_verifier');
      
      return response;
    }
    
    // Handle logout
    if (routeSegment === 'logout') {
      // Create the logout URL
      const logoutUrl = new URL(`https://${process.env.AUTH0_DOMAIN}/v2/logout`);
      const returnTo = new URL('/', request.url);
      logoutUrl.searchParams.set('client_id', process.env.AUTH0_CLIENT_ID!);
      logoutUrl.searchParams.set('returnTo', returnTo.toString());
      
      // Create a response that clears auth cookies and redirects to Auth0
      const response = NextResponse.redirect(logoutUrl.toString());
      
      // Clear all auth-related cookies
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      response.cookies.delete('code_verifier');
      
      return response;
    }
    
    // Handle user info endpoint
    if (routeSegment === 'me') {
      const accessToken = request.cookies.get('access_token')?.value;
      
      if (!accessToken) {
        return NextResponse.json(
          { error: 'Not authenticated' }, 
          { status: 401 }
        );
      }
      
      try {
        // Get user info from Auth0
        const userInfoUrl = `https://${process.env.AUTH0_DOMAIN}/userinfo`;
        const userInfoResponse = await fetch(userInfoUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        
        if (!userInfoResponse.ok) {
          console.error('Failed to fetch user info:', await userInfoResponse.text());
          return NextResponse.json(
            { error: 'Failed to fetch user info' }, 
            { status: 401 }
          );
        }
        
        const userInfo = await userInfoResponse.json();
        return NextResponse.json(userInfo);
        
      } catch (error) {
        console.error('Error fetching user info:', error);
        return NextResponse.json(
          { error: 'Internal server error' }, 
          { status: 500 }
        );
      }
    }
    
    // Default 404 for unknown routes
    return new NextResponse('Not found', { status: 404 });
    
  } catch (error) {
    console.error('Auth error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Authentication failed' }), 
      { status: 500 }
    );
  }
}

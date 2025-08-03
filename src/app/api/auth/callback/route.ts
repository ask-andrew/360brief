import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Helper function to decode JWT without verification
const decodeJwt = (token: string) => {
  try {
    const [header, payload] = token.split('.');
    return {
      header: JSON.parse(Buffer.from(header, 'base64').toString()),
      payload: JSON.parse(Buffer.from(payload, 'base64').toString())
    };
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export async function GET(request: Request) {
  // Log the full request URL and headers for debugging
  console.log('=== Auth Callback Debug ===');
  console.log('Request URL:', request.url);
  console.log('Request headers:', JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2));
  
  // Parse the URL and query parameters
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  
  console.log('=== Auth Callback Debug ===');
  console.log('URL:', request.url);
  console.log('Code:', code ? '***' : 'Not found');
  console.log('Error:', error || 'None');
  console.log('Error Description:', errorDescription || 'None');
  
  // Log environment variables (server-side) - only log keys, not values for security
  console.log('=== Server Environment Variables ===');
  console.log('AUTH0_ISSUER_BASE_URL:', process.env.AUTH0_ISSUER_BASE_URL ? '***' : 'Not set');
  console.log('AUTH0_CLIENT_ID:', process.env.AUTH0_CLIENT_ID ? '***' : 'Not set');
  console.log('AUTH0_CLIENT_SECRET:', process.env.AUTH0_CLIENT_SECRET ? '***' : 'Not set');
  console.log('AUTH0_BASE_URL:', process.env.AUTH0_BASE_URL || 'Not set');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return redirectToLoginWithError(error, errorDescription || 'Authentication failed');
  }
  
  // Verify we have an authorization code
  if (!code) {
    console.error('No authorization code found in callback URL');
    return redirectToLoginWithError('missing_code', 'No authorization code provided');
  }
  
  try {
    // Try to get code_verifier from cookies first
    const cookieHeader = request.headers.get('cookie') || '';
    console.log('Received cookies:', cookieHeader);
    
    // Parse cookies
    const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, cookie) => {
      const [key, ...rest] = cookie.trim().split('=');
      if (key) {
        acc[key.trim()] = decodeURIComponent(rest.join('=').split(';')[0]);
      }
      return acc;
    }, {});
    
    // Check for code_verifier in cookies
    let codeVerifier = cookies.code_verifier;
    console.log('Code verifier from cookies:', codeVerifier ? '***' : 'Not found');
    
    // If not in cookies, check the request body for sessionStorage fallback
    if (!codeVerifier) {
      try {
        const body = await request.json();
        if (body && body.code_verifier) {
          codeVerifier = body.code_verifier;
          console.log('Found code_verifier in request body');
        }
      } catch (e) {
        console.log('No code_verifier in request body');
      }
    }
    
    // If still not found, check URL params (as a last resort)
    if (!codeVerifier) {
      const url = new URL(request.url);
      const verifierParam = url.searchParams.get('state');
      if (verifierParam) {
        try {
          const state = JSON.parse(decodeURIComponent(verifierParam));
          if (state.code_verifier) {
            codeVerifier = state.code_verifier;
            console.log('Found code_verifier in state parameter');
          }
        } catch (e) {
          console.log('Could not parse state parameter');
        }
      }
    }
    
    if (!codeVerifier) {
      console.error('Missing code verifier in cookies');
      console.log('All cookies received:', Object.keys(cookies).join(', '));
      return redirectToLoginWithError('missing_verifier', 'Missing authentication state. Please try logging in again.');
    }
    
    // Exchange the authorization code for tokens
    const tokenEndpoint = `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`;
    const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/auth/callback`;
    
    console.log('Exchanging code for tokens...');
    console.log('Token endpoint:', tokenEndpoint);
    console.log('Client ID:', process.env.AUTH0_CLIENT_ID ? '***' : 'Not set');
    console.log('Base URL:', baseUrl);
    console.log('Redirect URI:', redirectUri);
    
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.AUTH0_CLIENT_ID || '',
      client_secret: process.env.AUTH0_CLIENT_SECRET || '',
      code: code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    });

    console.log('Token request params:', Object.fromEntries(tokenParams.entries()));
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text(); // Use text() first to avoid JSON parse errors
      console.error('Token exchange failed with status:', tokenResponse.status);
      console.error('Error response:', errorData);
      return redirectToLoginWithError(
        'token_exchange_failed', 
        `Failed to exchange authorization code for tokens: ${tokenResponse.status} ${tokenResponse.statusText}`
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('Token response status:', tokenResponse.status);
    
    if (tokenData.error) {
      console.error('Error in token response:', tokenData);
      return redirectToLoginWithError(
        tokenData.error || 'token_error',
        tokenData.error_description || 'Error in token response'
      );
    }
    
    // Decode and log token information (without verifying signature)
    if (tokenData.id_token) {
      const decodedIdToken = decodeJwt(tokenData.id_token);
      console.log('Decoded ID Token:', {
        header: decodedIdToken?.header,
        payload: {
          ...decodedIdToken?.payload,
          // Don't log sensitive claims
          email: decodedIdToken?.payload.email ? '***' : undefined,
          name: decodedIdToken?.payload.name ? '***' : undefined,
          picture: decodedIdToken?.payload.picture ? '***' : undefined,
        }
      });
    }
    
    if (tokenData.access_token) {
      const decodedAccessToken = decodeJwt(tokenData.access_token);
      console.log('Decoded Access Token:', {
        header: decodedAccessToken?.header,
        payload: {
          ...decodedAccessToken?.payload,
          // Don't log sensitive claims
          sub: decodedAccessToken?.payload.sub ? '***' : undefined,
          email: decodedAccessToken?.payload.email ? '***' : undefined,
          name: decodedAccessToken?.payload.name ? '***' : undefined,
        }
      });
    }
    
    console.log('Successfully obtained tokens');
    
    // Create a redirect response to the dashboard
    const redirectUrl = new URL('/dashboard', request.url);
    console.log('Redirecting to:', redirectUrl.toString());
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Set cookies with proper security attributes
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      // For local development, we need to set domain explicitly
      ...(process.env.NODE_ENV !== 'production' && { domain: 'localhost' })
    };

    // Set the access token in an HTTP-only cookie
    response.cookies.set({
      name: 'access_token',
      value: tokenData.access_token,
      maxAge: tokenData.expires_in || 3600, // Default to 1 hour if not specified
      ...cookieOptions
    });
    
    // Set the ID token in an HTTP-only cookie
    if (tokenData.id_token) {
      response.cookies.set({
        name: 'id_token',
        value: tokenData.id_token,
        maxAge: tokenData.expires_in || 3600,
        ...cookieOptions
      });
    }
    
    // Set the refresh token in an HTTP-only cookie if available
    if (tokenData.refresh_token) {
      response.cookies.set({
        name: 'refresh_token',
        value: tokenData.refresh_token,
        maxAge: 30 * 24 * 60 * 60, // 30 days
        ...cookieOptions
      });
    }
    
    console.log('Set authentication cookies with options:', cookieOptions);

    // Clear the code verifier cookie
    response.cookies.set({
      name: 'code_verifier',
      value: '',
      maxAge: -1, // Expire immediately
      ...cookieOptions,
      path: '/',
    });

    return response;
    
  } catch (error) {
    console.error('Auth callback error:', error);
    return redirectToLoginWithError('auth_error', error instanceof Error ? error.message : 'Authentication failed');
  }
}

// Helper function to redirect to login with error details
function redirectToLoginWithError(error: string, description: string) {
  console.error(`Auth error: ${error} - ${description}`);
  const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_AUTH0_BASE_URL || 'http://localhost:3000');
  loginUrl.searchParams.set('error', error);
  loginUrl.searchParams.set('error_description', encodeURIComponent(description));
  return NextResponse.redirect(loginUrl);
}

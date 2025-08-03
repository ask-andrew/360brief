'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// Client-side only component to prevent hydration issues
const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  // Client-side environment variables
  const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '';
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '';
  const baseUrl = process.env.NEXT_PUBLIC_AUTH0_BASE_URL || 'http://localhost:3000';
  
  // Debug: Log environment variables
  useEffect(() => {
    console.log('=== Environment Variables ===');
    console.log('NEXT_PUBLIC_AUTH0_DOMAIN:', auth0Domain);
    console.log('NEXT_PUBLIC_AUTH0_CLIENT_ID:', clientId ? '***' : 'Not set');
    console.log('NEXT_PUBLIC_AUTH0_BASE_URL:', baseUrl);
  }, []);

  // Use the exact callback URL that's in the allowed list
  const redirectUri = `${baseUrl}/api/auth/callback`;

  // Check for auth errors in URL params
  useEffect(() => {
    const error = searchParams?.get('error');
    const errorDesc = searchParams?.get('error_description');
    
    if (error) {
      setError(errorDesc || 'An authentication error occurred');
      console.error('Auth error:', error, errorDesc);
    }
  }, [searchParams]);

  // Generate a secure random string for the code verifier
  const generateCodeVerifier = (): string => {
    // Generate a random string of 43-128 characters (minimum 32 bytes, recommended 32-96 bytes)
    const array = new Uint8Array(32); // 32 bytes = 256 bits
    window.crypto.getRandomValues(array);
    
    // Convert to base64url
    const base64 = btoa(String.fromCharCode(...array));
    const verifier = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    console.log('Generated verifier length:', verifier.length);
    console.log('Verifier format:', /^[a-zA-Z0-9\-_]+$/.test(verifier) ? 'Valid' : 'Invalid');
    
    return verifier;
  };

  // Generate a code challenge from the verifier
  const generateCodeChallenge = async (verifier: string): Promise<string> => {
    try {
      console.log('Generating challenge from verifier, length:', verifier.length);
      
      // Convert the verifier to an ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(verifier);
      
      // Generate the SHA-256 hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      
      // Convert the hash to a base64url string
      const base64String = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
      const challenge = base64String
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      console.log('Generated challenge length:', challenge.length);
      console.log('Challenge format:', /^[a-zA-Z0-9\-_]+$/.test(challenge) ? 'Valid' : 'Invalid');
      
      if (challenge.length < 43 || challenge.length > 128) {
        throw new Error(`Invalid challenge length: ${challenge.length}. Must be between 43 and 128 characters.`);
      }
      
      return challenge;
    } catch (error) {
      console.error('Error generating code challenge:', error);
      throw error;
    }
  };

  // Handle the login button click
  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      console.log('=== PKCE Debug ===');
      console.log('Verifier length:', codeVerifier.length);
      console.log('Verifier format:', /^[a-zA-Z0-9\-_]+$/.test(codeVerifier) ? 'Valid' : 'Invalid');
      
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      console.log('Challenge length:', codeChallenge.length);
      console.log('Challenge format:', /^[a-zA-Z0-9\-_]+$/.test(codeChallenge) ? 'Valid' : 'Invalid');
      
      // Store the code verifier in sessionStorage as a fallback
      // This is more reliable than cookies for local development
      sessionStorage.setItem('code_verifier', codeVerifier);
      console.log('Stored code_verifier in sessionStorage');
      
      // Also set a cookie with proper attributes for cross-origin requests
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const domain = isLocalhost ? 'localhost' : window.location.hostname;
      
      // Set the cookie with proper attributes
      const cookieValue = [
        `code_verifier=${encodeURIComponent(codeVerifier)}`,
        'path=/',
        'max-age=600', // 10 minutes
        'samesite=none',
        'secure',
        `domain=${domain}`
      ].join('; ');
      
      document.cookie = cookieValue;
      console.log('Set cookie with options:', cookieValue);
      
      // Verify cookie was set (may not be visible due to httpOnly)
      console.log('Current cookies:', document.cookie);
      
      // Build the authorization URL
      const authUrl = new URL(`https://${auth0Domain}/authorize`);
      
      // Create a state object that includes the code verifier as a fallback
      const state = {
        code_verifier: codeVerifier,
        timestamp: Date.now(),
        // Add any other state you want to preserve
      };
      
      // Create URL parameters with proper encoding
      const params = new URLSearchParams();
      params.append('response_type', 'code');
      params.append('client_id', clientId);
      params.append('redirect_uri', redirectUri);
      params.append('scope', 'openid profile email');
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
      params.append('connection', 'google-oauth2');
      params.append('state', encodeURIComponent(JSON.stringify(state)));
      
      // Verify parameters before creating URL
      console.log('=== Authorization Parameters ===');
      console.log('response_type:', 'code');
      console.log('client_id:', clientId ? '***' : 'Not set');
      console.log('redirect_uri:', redirectUri);
      console.log('scope:', 'openid profile email');
      console.log('code_challenge:', codeChallenge ? '***' : 'Not set');
      console.log('code_challenge_method:', 'S256');
      console.log('connection:', 'google-oauth2');
      
      const fullAuthUrl = `${authUrl}?${params.toString()}`;
      
      // Verify the final URL
      const urlObj = new URL(fullAuthUrl);
      console.log('=== Final Authorization URL ===');
      console.log('Host:', urlObj.host);
      console.log('Path:', urlObj.pathname);
      console.log('Has code_challenge:', urlObj.searchParams.has('code_challenge'));
      console.log('code_challenge length:', urlObj.searchParams.get('code_challenge')?.length);
      
      // Redirect to Auth0
      console.log('=== Redirecting to Auth0 ===');
      window.location.href = fullAuthUrl;
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to initialize login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// This is the page component that renders the LoginForm client component
export default function LoginPage() {
  return <LoginForm />;
}

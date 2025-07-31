// netlify/functions/connect-google.ts

import { Handler } from '@netlify/functions';
import { OAuth2Client } from 'google-auth-library';
import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Environment variables (ensure these are set in Netlify dashboard)
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_API_AUDIENCE = process.env.AUTH0_API_AUDIENCE;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Auth0 key client
const client = jwksClient({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
});

// Helper to extract the signing key
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function (err: any, key: any) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const handler: Handler = async (event) => {
  // Enforce POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  // Check for required env vars
  if (!AUTH0_DOMAIN || !AUTH0_API_AUDIENCE || !CLIENT_ID || !CLIENT_SECRET) {
    console.error("❌ Missing environment variables.");
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Server configuration error.' }),
    };
  }

  // Extract Auth header
  const { authorization } = event.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Missing or invalid authorization token.' }),
    };
  }

  const token = authorization.substring(7);
  let userId: string;

  try {
    // Verify Auth0 JWT token
    const decoded = await new Promise<jwt.JwtPayload>((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          audience: AUTH0_API_AUDIENCE,
          issuer: `https://${AUTH0_DOMAIN}/`,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded as jwt.JwtPayload);
        }
      );
    });

    userId = decoded.sub as string;
    if (!userId) {
      throw new Error('User ID (sub) not found in token.');
    }
  } catch (error: any) {
    console.error("❌ Auth0 token verification failed:", error.message);
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Authentication failed: ' + error.message }),
    };
  }

  // Determine redirect URI
  const host = event.headers.host;
  const protocol = host.includes('localhost') || process.env.NETLIFY_DEV === 'true' ? 'http' : (event.headers['x-forwarded-proto'] || 'https');
  const redirectUri = `${protocol}://${host}/.netlify/functions/google-oauth-callback`;

  const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, redirectUri);

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
  ];

  // Build Google Auth URL
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
      state: userId,
      prompt: 'consent',
    });

    console.log("✅ Google Auth URL generated for user:", userId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authUrl }),
    };
  } catch (error: any) {
    console.error("❌ Failed to generate Google auth URL:", error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Failed to generate Google auth URL.' }),
    };
  }
};

export { handler };

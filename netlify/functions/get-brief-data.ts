// netlify/functions/get-brief-data.ts
import { Handler } from '@netlify/functions';
import { OAuth2Client } from 'google-auth-library';
import { UnifiedDataService } from '../../services/unifiedDataService';
import { userTokens } from '../../services/db';

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

// Type for the authenticated user from Auth0
type Auth0User = {
  sub: string;
  email?: string;
  name?: string;
};

export const handler: Handler = async (event, context) => {
  try {
    // 1. Get user from Auth0
    const user = await getAuthenticatedUser(event);
    if (!user) {
      console.error('Unauthorized: No user found in request');
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    console.log(`Processing request for user: ${user.sub} (${user.email || 'no email'})`);

    // 2. Get user's refresh token from database
    const tokenResult = await userTokens.get(user.sub, 'google');
    if (!tokenResult || !tokenResult.refreshToken) {
      console.error(`No Google account connected for user: ${user.sub}`);
      return { 
        statusCode: 400, 
        body: JSON.stringify({ 
          error: 'No Google account connected',
          requiresReconnect: true
        }) 
      };
    }

    // 3. Set credentials and get data
    try {
      oauth2Client.setCredentials({ refresh_token: tokenResult.refreshToken });
      const service = new UnifiedDataService(oauth2Client);
      const data = await service.getUnifiedBriefData(user.sub);

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minutes
        },
        body: JSON.stringify(data)
      };
    } catch (error: any) {
      console.error('Error fetching data from Google APIs:', error);
      
      // Check for token revocation
      if (error.message.includes('invalid_grant') || 
          error.message.includes('Token has been expired or revoked')) {
        console.log('Token is invalid or revoked, removing from database');
        await userTokens.delete(user.sub, 'google');
        
        return {
          statusCode: 401,
          body: JSON.stringify({
            error: 'Your Google connection has expired. Please reconnect your account.',
            requiresReconnect: true
          })
        };
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error in get-brief-data:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }) 
    };
  }
};

/**
 * Get the authenticated user from the request
 * This assumes you're using Auth0 for authentication
 */
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// ... (other imports and code)

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_API_AUDIENCE;

const client = jwksClient({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function (err: any, key: any) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

async function getAuthenticatedUser(event: any): Promise<Auth0User | null> {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      console.error('No authorization header found');
      return null;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('No token found in authorization header');
      return null;
    }
    return new Promise((resolve) => {
      jwt.verify(
        token,
        getKey,
        {
          audience: AUTH0_AUDIENCE,
          issuer: `https://${AUTH0_DOMAIN}/`,
          algorithms: ['RS256']
        },
        (err: any, decoded: any) => {
          if (err) {
            console.error('JWT verification failed:', err);
            return resolve(null);
          }
          resolve({
            sub: decoded.sub,
            email: decoded.email,
            name: decoded.name
          });
        }
      );
    });
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

// Example JWT verification function (for reference)
/*
async function verifyJwtToken(token: string): Promise<Auth0User> {
  const jwksClient = require('jwks-rsa');
  const jwt = require('jsonwebtoken');
  
  const client = jwksClient({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  });

  function getKey(header: any, callback: any) {
    client.getSigningKey(header.kid, (err: any, key: any) => {
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  }

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256']
      },
      (err: any, decoded: any) => {
        if (err) return reject(err);
        resolve(decoded as Auth0User);
      }
    );
  });
}
*/
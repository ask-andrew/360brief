// netlify/functions/connect-google.ts

import type { Handler } from "@netlify/functions";
import { google } from "googleapis";
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// These should be set as environment variables in your Netlify site settings
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_API_AUDIENCE = process.env.AUTH0_API_AUDIENCE; // <-- CHANGE THIS LINE to your API audience ENV var name

const client = jwksClient({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header: any, callback: any){
  client.getSigningKey(header.kid, function(err: any, key: any) {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  // Ensure you check for the correct audience variable
  if (!AUTH0_DOMAIN || !AUTH0_API_AUDIENCE) { 
    return { statusCode: 500, body: JSON.stringify({ message: "Auth0 environment variables not configured on the server." })};
  }

  const { authorization } = event.headers;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ message: "Missing or invalid authorization token." }) };
  }
  const token = authorization.substring(7);

  try {
    const decoded = await new Promise<jwt.JwtPayload>((resolve, reject) => {
      jwt.verify(token, getKey, {
        audience: AUTH0_API_AUDIENCE, // <-- USE THE CORRECT API AUDIENCE HERE
        issuer: `https://${AUTH0_DOMAIN}/`,
        algorithms: ['RS256']
      }, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded as jwt.JwtPayload);
      });
    });

    const userId = decoded.sub;
    if (!userId) {
        throw new Error('User ID (sub) not found in token.');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.URL}/.netlify/functions/google-oauth-callback`
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: userId,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authUrl }),
    };

  } catch (error: any) {
    console.error("Auth validation or Google URL generation failed:", error);
    return { 
      statusCode: 401, 
      body: JSON.stringify({ message: "Authentication failed: " + error.message }) 
    };
  }
};

export { handler };

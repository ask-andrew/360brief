import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
);

// Required API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/**
 * Generates the Google OAuth2 authorization URL
 * @param state Optional state parameter for redirect URL
 * @returns Authorization URL
 */
export function getGoogleAuthUrl(state?: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: state || '',
  });
}

/**
 * Exchanges authorization code for tokens
 * @param code Authorization code from Google
 * @returns Token information
 */
export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Refreshes an expired access token
 * @param refreshToken User's refresh token
 * @returns New access token
 */
export async function refreshAccessToken(refreshToken: string) {
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials.access_token;
}

/**
 * Gets the user's profile information from Google
 * @param accessToken Valid access token
 * @returns User profile information
 */
export async function getUserProfile(accessToken: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
  });
  
  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: 'v2',
  });
  
  const { data } = await oauth2.userinfo.get();
  return data;
}

/**
 * Saves Google OAuth tokens to the database
 * @param userId User ID
 * @param tokens Token information from Google
 */
export async function saveTokens(
  userId: string,
  tokens: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    token_type: string;
    scope: string;
  }
) {
  const { error } = await supabase
    .from('user_tokens')
    .upsert(
      {
        user_id: userId,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expiry_date).toISOString(),
        token_type: tokens.token_type,
        scope: tokens.scope,
      },
      { onConflict: 'user_id,provider' }
    );

  if (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
}

/**
 * Gets the stored tokens for a user
 * @param userId User ID
 * @returns Stored token information or null if not found
 */
export async function getStoredTokens(userId: string) {
  const { data, error } = await supabase
    .from('user_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows found
      return null;
    }
    console.error('Error getting tokens:', error);
    throw error;
  }

  return data;
}

/**
 * Checks if the access token is expired
 * @param expiresAt Token expiration date string
 * @returns boolean indicating if token is expired
 */
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Gets a valid access token, refreshing if necessary
 * @param userId User ID
 * @returns Valid access token
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const tokens = await getStoredTokens(userId);
  
  if (!tokens) {
    throw new Error('No Google OAuth tokens found. Please re-authenticate.');
  }
  
  // If token is not expired, return it
  if (!isTokenExpired(tokens.expires_at)) {
    return tokens.access_token;
  }
  
  // Otherwise, refresh the token
  try {
    const newAccessToken = await refreshAccessToken(tokens.refresh_token);
    
    // Update the stored tokens
    await saveTokens(userId, {
      ...tokens,
      access_token: newAccessToken,
      // Google doesn't return a new refresh token, so we keep the existing one
      refresh_token: tokens.refresh_token,
      // Set expiry to 1 hour from now (Google tokens are typically valid for 1 hour)
      expiry_date: Date.now() + 3600 * 1000,
    });
    
    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token. Please re-authenticate.');
  }
}

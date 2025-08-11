// Netlify types are optional; using any to avoid type dependency
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const handler = async (event: any, context: any) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { code, state } = event.queryStringParameters || {};

    if (!code) {
      throw new Error('Authorization code is required');
    }

    // Parse state which may be either a plain redirect URL or a base64-encoded JSON
    // { redirect: string, account_type?: 'personal'|'business' }
    let redirectUri = `${process.env.APP_URL}/dashboard`;
    let accountType: 'personal' | 'business' = 'personal';
    if (state) {
      try {
        const decoded = decodeURIComponent(state);
        // Try JSON first
        const maybeJson = JSON.parse(Buffer.from(decoded, 'base64').toString('utf-8'));
        if (maybeJson && typeof maybeJson === 'object') {
          if (maybeJson.redirect && typeof maybeJson.redirect === 'string') {
            redirectUri = maybeJson.redirect;
          }
          if (maybeJson.account_type === 'personal' || maybeJson.account_type === 'business') {
            accountType = maybeJson.account_type;
          }
        }
      } catch {
        // Fallback: treat state as a plain redirect URL
        try {
          redirectUri = decodeURIComponent(state);
        } catch {
          // keep default
        }
      }
    }

    // Exchange the authorization code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.APP_URL}/api/auth/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get access and refresh tokens');
    }

    // Get the user's email from the ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload?.email;
    const providerAccountId = payload?.sub; // Google account id
    
    if (!email || !providerAccountId) {
      throw new Error('Could not get user identity from Google');
    }

    // Get the Supabase user ID from the email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.error('Error finding user:', userError);
      // If user doesn't exist, you might want to create one or handle this case
      throw new Error('User not found');
    }

    // Store the tokens in the new connected accounts table to support multiple accounts
    const scopes = tokens.scope ? tokens.scope.split(' ') : [];
    const { error: accountError } = await supabase
      .from('user_connected_accounts')
      .upsert(
        {
          user_id: userData.id,
          provider: 'google',
          provider_account_id: providerAccountId,
          email,
          account_type: accountType,
          scopes,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          token_type: tokens.token_type,
        },
        { onConflict: 'user_id,provider,provider_account_id' }
      );

    if (accountError) {
      console.error('Error storing connected account:', accountError);
      throw accountError;
    }

    // Redirect back to the application with success status
    return {
      statusCode: 302,
      headers: {
        Location: `${redirectUri}?auth=success`,
      },
      body: '',
    };
  } catch (error) {
    console.error('Error in auth callback:', error);
    
    // Redirect back to the application with error status
    return {
      statusCode: 302,
      headers: {
        Location: `/?auth=error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`,
      },
      body: '',
    };
  }
};

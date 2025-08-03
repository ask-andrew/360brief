import { Handler } from '@netlify/functions';
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

export const handler: Handler = async (event, context) => {
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

    // Get the original redirect URI from the state or use a default
    const redirectUri = state 
      ? decodeURIComponent(state) 
      : `${process.env.APP_URL}/dashboard`;

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
    
    if (!email) {
      throw new Error('Could not get user email from Google');
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

    // Store the tokens in the database
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .upsert(
        {
          user_id: userData.id,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          token_type: tokens.token_type,
          scope: tokens.scope,
        },
        { onConflict: 'user_id,provider' }
      );

    if (tokenError) {
      console.error('Error storing tokens:', tokenError);
      throw tokenError;
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
        Location: `/?auth=error&message=${encodeURIComponent(error.message)}`,
      },
      body: '',
    };
  }
};

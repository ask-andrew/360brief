import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';

// Force Node.js runtime for service role operations
export const runtime = 'nodejs';

/**
 * Get a valid Google access token using the unified OAuth approach
 * Retrieves refresh token from user_metadata and exchanges it for a fresh access token
 */
export async function getValidGoogleAccessToken(userId: string): Promise<string> {
  console.log(`🔍 getValidGoogleAccessToken (unified) called with userId: ${userId}`);
  
  const supabase = await createClient();
  
  // Get user with metadata
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
  
  if (userError || !userData?.user) {
    console.error(`❌ Failed to get user ${userId}:`, userError);
    throw new Error('User not found');
  }

  const refreshToken = userData.user.user_metadata?.google_refresh_token;
  
  if (!refreshToken) {
    console.error(`❌ No Google refresh token found in user_metadata for user ${userId}`);
    throw new Error('No Google account connected. Please sign in again.');
  }

  console.log(`✅ Found Google refresh token in user_metadata for user ${userId}`);

  // Use Google OAuth2 client to refresh access token
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      // No redirect URI needed for token refresh
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    console.log('🔄 Refreshing Google access token...');
    
    // Get fresh access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('No access token received from refresh');
    }

    console.log(`✅ Successfully refreshed Google access token for user ${userId}`);
    console.log(`🔍 Token expires at: ${credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : 'unknown'}`);

    // Optionally update the refresh token if Google provided a new one
    if (credentials.refresh_token && credentials.refresh_token !== refreshToken) {
      console.log('🔄 Updating refresh token in user_metadata...');
      
      const updatedMetadata = {
        ...userData.user.user_metadata,
        google_refresh_token: credentials.refresh_token,
        google_last_refreshed: new Date().toISOString()
      };

      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: updatedMetadata
      });

      if (updateError) {
        console.error('⚠️ Failed to update refresh token (continuing with old token):', updateError);
      } else {
        console.log('✅ Updated refresh token in user_metadata');
      }
    }

    return credentials.access_token;

  } catch (error: any) {
    console.error('❌ Google token refresh failed:', error);
    
    // Handle specific error cases
    if (error.message?.includes('invalid_grant')) {
      // Refresh token is invalid - user needs to re-authenticate
      console.log('🔄 Refresh token invalid, clearing user_metadata...');
      
      const clearedMetadata = {
        ...userData.user.user_metadata,
      };
      delete clearedMetadata.google_refresh_token;
      delete clearedMetadata.google_connected_at;
      
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: clearedMetadata
      });
      
      throw new Error('Google connection expired. Please sign in again to reconnect.');
    }
    
    throw new Error(`Google authentication failed: ${error.message}`);
  }
}

/**
 * Check if user has a valid Google connection
 */
export async function hasValidGoogleConnection(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: userData, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error || !userData?.user) {
      return false;
    }

    return !!userData.user.user_metadata?.google_refresh_token;
  } catch (error) {
    console.error('Error checking Google connection:', error);
    return false;
  }
}

/**
 * Get Google connection status for user
 */
export async function getGoogleConnectionStatus(userId: string) {
  try {
    const supabase = await createClient();
    const { data: userData, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error || !userData?.user) {
      return { connected: false, error: 'User not found' };
    }

    const refreshToken = userData.user.user_metadata?.google_refresh_token;
    const connectedAt = userData.user.user_metadata?.google_connected_at;
    
    return {
      connected: !!refreshToken,
      connectedAt,
      lastRefreshed: userData.user.user_metadata?.google_last_refreshed
    };
  } catch (error) {
    return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
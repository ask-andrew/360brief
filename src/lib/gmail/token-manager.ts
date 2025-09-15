import { createClient } from '@supabase/supabase-js';
import { refreshAccessToken } from '@/server/google/client';
import { normalizeToSeconds } from '@/lib/utils/timestamp';

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number | null;
  token_type?: string;
}

export class TokenManager {
  private supabase: any;

  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials for TokenManager');
    }

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async getTokens(userId: string, provider: string = 'google'): Promise<TokenData | null> {
    try {
      console.log(`📥 Fetching ${provider} tokens for user ${userId}`);

      const { data, error } = await this.supabase
        .from('user_tokens')
        .select('access_token, refresh_token, expires_at, token_type')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`ℹ️ No ${provider} tokens found for user ${userId}`);
          return null;
        }
        console.error(`❌ Error fetching ${provider} tokens:`, error);
        throw error;
      }

      if (!data || !data.access_token) {
        console.log(`⚠️ Invalid token data for user ${userId}`);
        return null;
      }

      const expiresAt = data.expires_at ? Number(data.expires_at) : null;
      const nowSeconds = Math.floor(Date.now() / 1000);

      console.log(`🔍 Token status:`, {
        hasAccessToken: !!data.access_token,
        hasRefreshToken: !!data.refresh_token,
        expiresAt: expiresAt ? new Date(expiresAt * 1000).toISOString() : 'never',
        expired: expiresAt ? nowSeconds > expiresAt : false,
        secondsUntilExpiry: expiresAt ? expiresAt - nowSeconds : null
      });

      // Check if token is expired and needs refresh
      if (data.refresh_token && expiresAt && nowSeconds > expiresAt - 300) {
        console.log(`🔄 Token expired or expiring soon, refreshing...`);
        return await this.refreshToken(userId, data.refresh_token, provider);
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: expiresAt,
        token_type: data.token_type || 'Bearer'
      };

    } catch (error) {
      console.error(`❌ TokenManager.getTokens error:`, error);
      throw error;
    }
  }

  async refreshToken(userId: string, refreshToken: string, provider: string = 'google'): Promise<TokenData> {
    try {
      console.log(`🔄 Refreshing ${provider} token for user ${userId}`);

      if (provider !== 'google') {
        throw new Error(`Token refresh not implemented for provider: ${provider}`);
      }

      // Use the existing refresh logic from google/client.ts
      const newTokens = await refreshAccessToken(refreshToken);

      if (!newTokens.access_token) {
        throw new Error('Failed to refresh token - no access token received');
      }

      // Convert expiry_date to Unix seconds
      const expiresAtSeconds = newTokens.expiry_date
        ? normalizeToSeconds(newTokens.expiry_date)
        : null;

      // Update tokens in database
      const { error: updateError } = await this.supabase
        .from('user_tokens')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token || refreshToken,
          expires_at: expiresAtSeconds,
          updated_at: normalizeToSeconds(Date.now()),
          token_type: newTokens.token_type || 'Bearer'
        })
        .eq('user_id', userId)
        .eq('provider', provider);

      if (updateError) {
        console.error(`❌ Failed to update refreshed token:`, updateError);
        throw updateError;
      }

      console.log(`✅ Token refreshed successfully, expires at: ${expiresAtSeconds ? new Date(expiresAtSeconds * 1000).toISOString() : 'never'}`);

      return {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || refreshToken,
        expires_at: expiresAtSeconds,
        token_type: newTokens.token_type || 'Bearer'
      };

    } catch (error) {
      console.error(`❌ TokenManager.refreshToken error:`, error);
      throw error;
    }
  }

  async saveTokens(userId: string, tokens: TokenData, provider: string = 'google'): Promise<void> {
    try {
      console.log(`💾 Saving ${provider} tokens for user ${userId}`);

      const nowSeconds = normalizeToSeconds(Date.now());
      const expiresAtSeconds = tokens.expires_at
        ? normalizeToSeconds(tokens.expires_at)
        : null;

      const tokenData = {
        user_id: userId,
        provider,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAtSeconds,
        updated_at: nowSeconds,
        token_type: tokens.token_type || 'Bearer'
      };

      const { error } = await this.supabase
        .from('user_tokens')
        .upsert(tokenData, {
          onConflict: 'user_id,provider'
        });

      if (error) {
        console.error(`❌ Failed to save ${provider} tokens:`, error);
        throw error;
      }

      console.log(`✅ ${provider} tokens saved successfully`);

    } catch (error) {
      console.error(`❌ TokenManager.saveTokens error:`, error);
      throw error;
    }
  }

  async deleteTokens(userId: string, provider: string = 'google'): Promise<void> {
    try {
      console.log(`🗑️ Deleting ${provider} tokens for user ${userId}`);

      const { error } = await this.supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);

      if (error) {
        console.error(`❌ Failed to delete ${provider} tokens:`, error);
        throw error;
      }

      console.log(`✅ ${provider} tokens deleted successfully`);

    } catch (error) {
      console.error(`❌ TokenManager.deleteTokens error:`, error);
      throw error;
    }
  }

  async checkTokenStatus(userId: string, provider: string = 'google'): Promise<{
    connected: boolean;
    expired: boolean;
    expiresAt: string | null;
    needsRefresh: boolean;
  }> {
    try {
      const tokens = await this.getTokens(userId, provider);

      if (!tokens || !tokens.access_token) {
        return {
          connected: false,
          expired: false,
          expiresAt: null,
          needsRefresh: false
        };
      }

      const nowSeconds = Math.floor(Date.now() / 1000);
      const expired = tokens.expires_at ? nowSeconds > tokens.expires_at : false;
      const needsRefresh = tokens.expires_at ? nowSeconds > tokens.expires_at - 300 : false;

      return {
        connected: true,
        expired,
        expiresAt: tokens.expires_at ? new Date(tokens.expires_at * 1000).toISOString() : null,
        needsRefresh
      };

    } catch (error) {
      console.error(`❌ TokenManager.checkTokenStatus error:`, error);
      return {
        connected: false,
        expired: false,
        expiresAt: null,
        needsRefresh: false
      };
    }
  }
}

// Singleton instance
let tokenManagerInstance: TokenManager | null = null;

export function getTokenManager(): TokenManager {
  if (!tokenManagerInstance) {
    tokenManagerInstance = new TokenManager();
  }
  return tokenManagerInstance;
}
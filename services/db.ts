import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';

// Types
type Provider = 'google' | 'microsoft' | 'slack' | 'asana' | 'notion';

interface UserToken {
  user_id: string;
  provider: Provider;
  refresh_token: string;
  access_token?: string;
  expires_at?: number;
  created_at: string;
  updated_at: string;
  scopes?: string[];
  token_metadata?: Record<string, any>;
}

interface UserPreferences {
  user_id: string;
  timezone: string;
  digest_frequency: 'daily' | 'weekly' | 'weekdays' | 'custom';
  digest_time: string; // HH:MM format
  preferred_format: 'email' | 'web' | 'both';
  email_notifications: boolean;
  priority_keywords: string[];
  key_contacts: string[];
  created_at: string;
  updated_at: string;
}

// Initialize the Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false, // We'll handle session management ourselves
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
  }
);

// User tokens table operations
export const userTokens = {
  /**
   * Store or update a user's OAuth tokens
   * @param userId - The user's unique identifier
   * @param provider - OAuth provider (google, microsoft, etc.)
   * @param tokens - Object containing tokens and metadata
   */
  async set(
    userId: string, 
    provider: Provider, 
    tokens: {
      refreshToken: string;
      accessToken?: string;
      expiresIn?: number;
      scopes?: string[];
      metadata?: Record<string, any>;
    }
  ): Promise<UserToken | null> {
    const now = new Date().toISOString();
    const expiresAt = tokens.expiresIn 
      ? Math.floor(Date.now() / 1000) + tokens.expiresIn 
      : undefined;

    const { data, error } = await supabase
      .from('user_tokens')
      .upsert(
        { 
          user_id: userId, 
          provider,
          refresh_token: tokens.refreshToken,
          access_token: tokens.accessToken,
          expires_at: expiresAt,
          scopes: tokens.scopes,
          token_metadata: tokens.metadata,
          updated_at: now,
          created_at: () => `COALESCE(created_at, '${now}')`
        } as any,
        { 
          onConflict: 'user_id,provider',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving user token:', error);
      throw error;
    }
    
    return data as unknown as UserToken;
  },

  /**
   * Get a user's OAuth tokens
   * @param userId - The user's unique identifier
   * @param provider - OAuth provider (google, microsoft, etc.)
   */
  async get(userId: string, provider: Provider): Promise<{
    refreshToken: string;
    accessToken?: string;
    expiresAt?: number;
    scopes?: string[];
    metadata?: Record<string, any>;
  } | null> {
    const { data, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error?.code === 'PGRST116') return null; // No rows found
    if (error) {
      console.error('Error fetching user token:', error);
      throw error;
    }
    
    const token = data as unknown as UserToken;
    return {
      refreshToken: token.refresh_token,
      accessToken: token.access_token,
      expiresAt: token.expires_at,
      scopes: token.scopes,
      metadata: token.token_metadata
    };
  },

  /**
   * Delete a user's OAuth tokens
   * @param userId - The user's unique identifier
   * @param provider - OAuth provider (google, microsoft, etc.)
   */
  async delete(userId: string, provider: Provider): Promise<boolean> {
    const { error } = await supabase
      .from('user_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) throw error;
    return true;
  },

  /**
   * Get all tokens for a user
   * @param userId - The user's unique identifier
   */
  async getAllForUser(userId: string): Promise<Record<Provider, {
    refreshToken: string;
    accessToken?: string;
    expiresAt?: number;
    scopes?: string[];
    metadata?: Record<string, any>;
  }>> {
    const { data, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user tokens:', error);
      throw error;
    }

    const result: Record<string, any> = {};
    (data || []).forEach((token: any) => {
      result[token.provider] = {
        refreshToken: token.refresh_token,
        accessToken: token.access_token,
        expiresAt: token.expires_at,
        scopes: token.scopes,
        metadata: token.token_metadata
      };
    });

    return result as any;
  },

  /**
   * Check if a user has a valid token for a provider
   * @param userId - The user's unique identifier
   * @param provider - OAuth provider (google, microsoft, etc.)
   * @param requiredScopes - Optional array of required scopes
   */
  async hasValidToken(
    userId: string, 
    provider: Provider, 
    requiredScopes?: string[]
  ): Promise<boolean> {
    const token = await this.get(userId, provider);
    if (!token) return false;
    
    // Check if token is expired
    if (token.expiresAt && token.expiresAt < Math.floor(Date.now() / 1000)) {
      return false;
    }
    
    // Check if all required scopes are present
    if (requiredScopes && token.scopes) {
      const hasAllScopes = requiredScopes.every(scope => 
        token.scopes?.includes(scope)
      );
      if (!hasAllScopes) return false;
    }
    
    return true;
  }
};

// User preferences table operations
export const userPreferences = {
  /**
   * Get user preferences
   * @param userId - The user's unique identifier
   */
  async get(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error?.code === 'PGRST116') {
      // No preferences found, return defaults
      return {
        user_id: userId,
        timezone: 'UTC',
        digest_frequency: 'daily',
        digest_time: '07:00',
        preferred_format: 'email',
        email_notifications: true,
        priority_keywords: [],
        key_contacts: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    if (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
    
    return data as unknown as UserPreferences;
  },

  /**
   * Update user preferences
   * @param userId - The user's unique identifier
   * @param updates - Partial object with preference updates
   */
  async update(
    userId: string, 
    updates: Partial<Omit<UserPreferences, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<UserPreferences> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          ...updates,
          updated_at: now,
          created_at: () => `COALESCE(created_at, '${now}')`
        } as any,
        { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
    
    return data as unknown as UserPreferences;
  },
  
  /**
   * Get the next scheduled digest time based on user preferences
   * @param userId - The user's unique identifier
   */
  async getNextDigestTime(userId: string): Promise<Date | null> {
    const prefs = await this.get(userId);
    if (!prefs) return null;
    
    const now = DateTime.now().setZone(prefs.timezone || 'UTC');
    let nextDigest: DateTime;
    
    // Parse the digest time (HH:MM format)
    const [hours, minutes] = prefs.digest_time.split(':').map(Number);
    
    // Create today's digest time
    let digestTime = now.set({ 
      hour: hours, 
      minute: minutes, 
      second: 0, 
      millisecond: 0 
    });
    
    // If today's digest time has already passed, schedule for next occurrence
    if (digestTime <= now) {
      if (prefs.digest_frequency === 'daily') {
        nextDigest = digestTime.plus({ days: 1 });
      } else if (prefs.digest_frequency === 'weekdays') {
        // Find next weekday
        let daysToAdd = 1;
        let nextDay = now.plus({ days: daysToAdd });
        while ([6, 7].includes(nextDay.weekday)) { // 6=Saturday, 7=Sunday
          daysToAdd++;
          nextDay = now.plus({ days: daysToAdd });
        }
        nextDigest = digestTime.plus({ days: daysToAdd });
      } else if (prefs.digest_frequency === 'weekly') {
        nextDigest = digestTime.plus({ weeks: 1 });
      } else {
        // Custom frequency not yet implemented
        return null;
      }
    } else {
      nextDigest = digestTime;
    }
    
    return nextDigest.toJSDate();
  }
};

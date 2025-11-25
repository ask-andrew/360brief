/**
 * Message Cache Service
 * Manages cached Gmail messages to reduce API calls
 * 
 * @module services/analytics/messageCacheService
 */

import { createClient } from '@supabase/supabase-js';
import type {
  MessageCacheEntry,
  MessageProvider,
  ProcessedMessageData,
} from '@/types/analytics-jobs';
import { DB_TABLES } from '@/types/analytics-jobs';

export interface CacheQueryOptions {
  provider?: MessageProvider;
  since?: Date;
  limit?: number;
  threadId?: string;
}

export interface CacheBulkInsert {
  user_id: string;
  message_id: string;
  thread_id?: string;
  provider: MessageProvider;
  raw_data: any;
  processed_data?: ProcessedMessageData;
  internal_date?: Date;
  subject?: string;
  from_email?: string;
  to_emails?: string[];
  has_attachments?: boolean;
}

/**
 * Message Cache Service
 * Handles storage and retrieval of cached email messages
 */
export class MessageCacheService {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseClient?: ReturnType<typeof createClient>) {
    this.supabase = supabaseClient ?? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Cache a single message
   * @param message Message data to cache
   * @returns Cached entry
   */
  async cacheMessage(message: CacheBulkInsert): Promise<MessageCacheEntry> {
    const cacheData = {
      user_id: message.user_id,
      message_id: message.message_id,
      thread_id: message.thread_id || null,
      provider: message.provider,
      raw_data: message.raw_data,
      processed_data: message.processed_data || null,
      internal_date: message.internal_date?.toISOString() || null,
      subject: message.subject || null,
      from_email: message.from_email || null,
      to_emails: message.to_emails || null,
      has_attachments: message.has_attachments || false,
      cache_version: 1,
    };

    const { data, error } = await this.supabase
      .from(DB_TABLES.MESSAGE_CACHE)
      .upsert(cacheData, {
        onConflict: 'user_id,message_id,provider',
      })
      .select()
      .single();

    if (error) {
      console.error('Error caching message:', error);
      throw new Error(`Failed to cache message: ${error.message}`);
    }

    return data as MessageCacheEntry;
  }

  /**
   * Cache multiple messages in bulk
   * @param messages Array of messages to cache
   * @returns Number of messages cached
   */
  async cacheBulk(messages: CacheBulkInsert[]): Promise<number> {
    if (messages.length === 0) return 0;

    const cacheData = messages.map(msg => ({
      user_id: msg.user_id,
      message_id: msg.message_id,
      thread_id: msg.thread_id || null,
      provider: msg.provider,
      raw_data: msg.raw_data,
      processed_data: msg.processed_data || null,
      internal_date: msg.internal_date?.toISOString() || null,
      subject: msg.subject || null,
      from_email: msg.from_email || null,
      to_emails: msg.to_emails || null,
      has_attachments: msg.has_attachments || false,
      cache_version: 1,
    }));

    const { data, error } = await this.supabase
      .from(DB_TABLES.MESSAGE_CACHE)
      .upsert(cacheData, {
        onConflict: 'user_id,message_id,provider',
      })
      .select();

    if (error) {
      console.error('Error bulk caching messages:', error);
      throw new Error(`Failed to bulk cache messages: ${error.message}`);
    }

    console.log(`✅ Cached ${data?.length || 0} messages`);
    return data?.length || 0;
  }

  /**
   * Get cached message by ID
   * @param userId User ID
   * @param messageId Message ID
   * @param provider Provider (default: gmail)
   * @returns Cached message or null
   */
  async getMessage(
    userId: string,
    messageId: string,
    provider: MessageProvider = 'gmail'
  ): Promise<MessageCacheEntry | null> {
    const { data, error } = await this.supabase
      .from(DB_TABLES.MESSAGE_CACHE)
      .select('*')
      .eq('user_id', userId)
      .eq('message_id', messageId)
      .eq('provider', provider)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching cached message:', error);
      throw new Error(`Failed to fetch cached message: ${error.message}`);
    }

    return data as MessageCacheEntry;
  }

  /**
   * Get cached messages for a user
   * @param userId User ID
   * @param options Query options
   * @returns Array of cached messages
   */
  async getMessages(
    userId: string,
    options: CacheQueryOptions = {}
  ): Promise<MessageCacheEntry[]> {
    let query = this.supabase
      .from(DB_TABLES.MESSAGE_CACHE)
      .select('*')
      .eq('user_id', userId);

    if (options.provider) {
      query = query.eq('provider', options.provider);
    }

    if (options.since) {
      query = query.gte('internal_date', options.since.toISOString());
    }

    if (options.threadId) {
      query = query.eq('thread_id', options.threadId);
    }

    // Always order by internal_date descending (newest first)
    query = query.order('internal_date', { ascending: false, nullsFirst: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cached messages:', error);
      throw new Error(`Failed to fetch cached messages: ${error.message}`);
    }

    return (data as MessageCacheEntry[]) || [];
  }

  /**
   * Get messages by thread ID
   * @param userId User ID
   * @param threadId Thread ID
   * @returns Messages in the thread
   */
  async getThreadMessages(userId: string, threadId: string): Promise<MessageCacheEntry[]> {
    return this.getMessages(userId, { threadId });
  }

  /**
   * Check if messages are cached
   * @param userId User ID
   * @param messageIds Array of message IDs to check
   * @param provider Provider (default: gmail)
   * @returns Map of messageId -> boolean (true if cached)
   */
  async checkCached(
    userId: string,
    messageIds: string[],
    provider: MessageProvider = 'gmail'
  ): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();
    
    if (messageIds.length === 0) return result;

    const { data, error } = await this.supabase
      .from(DB_TABLES.MESSAGE_CACHE)
      .select('message_id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .in('message_id', messageIds);

    if (error) {
      console.error('Error checking cached messages:', error);
      // Return all false on error
      messageIds.forEach(id => result.set(id, false));
      return result;
    }

    const cachedIds = new Set(data?.map(d => d.message_id) || []);
    messageIds.forEach(id => result.set(id, cachedIds.has(id)));
    
    return result;
  }

  /**
   * Get cache statistics for a user
   * @param userId User ID
   * @param provider Optional provider filter
   * @returns Cache statistics
   */
  async getCacheStats(userId: string, provider?: MessageProvider) {
    let query = this.supabase
      .from(DB_TABLES.MESSAGE_CACHE)
      .select('id', { count: 'exact', head: false })
      .eq('user_id', userId);

    if (provider) {
      query = query.eq('provider', provider);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching cache stats:', error);
      return {
        total_messages: 0,
        provider,
      };
    }

    // Get oldest and newest messages
    const { data: oldest } = await this.supabase
      .from(DB_TABLES.MESSAGE_CACHE)
      .select('internal_date, fetched_at')
      .eq('user_id', userId)
      .order('internal_date', { ascending: true, nullsFirst: false })
      .limit(1);

    const { data: newest } = await this.supabase
      .from(DB_TABLES.MESSAGE_CACHE)
      .select('internal_date, fetched_at')
      .eq('user_id', userId)
      .order('internal_date', { ascending: false, nullsFirst: false })
      .limit(1);

    return {
      total_messages: count || 0,
      oldest_message: oldest?.[0]?.internal_date || null,
      newest_message: newest?.[0]?.internal_date || null,
      oldest_fetch: oldest?.[0]?.fetched_at || null,
      newest_fetch: newest?.[0]?.fetched_at || null,
      provider,
    };
  }

  /**
   * Update processed data for a cached message
   * @param userId User ID
   * @param messageId Message ID
   * @param processedData Processed message data
   * @param provider Provider (default: gmail)
   * @returns Updated cache entry
   */
  async updateProcessedData(
    userId: string,
    messageId: string,
    processedData: ProcessedMessageData,
    provider: MessageProvider = 'gmail'
  ): Promise<MessageCacheEntry> {
    const { data, error } = await this.supabase
      .from(DB_TABLES.MESSAGE_CACHE)
      .update({ processed_data: processedData })
      .eq('user_id', userId)
      .eq('message_id', messageId)
      .eq('provider', provider)
      .select()
      .single();

    if (error) {
      console.error('Error updating processed data:', error);
      throw new Error(`Failed to update processed data: ${error.message}`);
    }

    return data as MessageCacheEntry;
  }

  /**
   * Delete cached messages older than specified date
   * @param userId User ID
   * @param olderThan Delete messages older than this date
   * @param provider Optional provider filter
   * @returns Number of deleted messages
   */
  async deleteOldMessages(
    userId: string,
    olderThan: Date,
    provider?: MessageProvider
  ): Promise<number> {
    let query = this.supabase
      .from(DB_TABLES.MESSAGE_CACHE)
      .delete({ count: 'exact' })
      .eq('user_id', userId)
      .lt('fetched_at', olderThan.toISOString());

    if (provider) {
      query = query.eq('provider', provider);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error deleting old messages:', error);
      throw new Error(`Failed to delete old messages: ${error.message}`);
    }

    console.log(`🧹 Deleted ${count || 0} old cached messages for user ${userId}`);
    return count || 0;
  }

  /**
   * Clear all cached messages for a user
   * @param userId User ID
   * @param provider Optional provider filter
   * @returns Number of deleted messages
   */
  async clearCache(userId: string, provider?: MessageProvider): Promise<number> {
    let query = this.supabase
      .from(DB_TABLES.MESSAGE_CACHE)
      .delete({ count: 'exact' })
      .eq('user_id', userId);

    if (provider) {
      query = query.eq('provider', provider);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error clearing cache:', error);
      throw new Error(`Failed to clear cache: ${error.message}`);
    }

    console.log(`🧹 Cleared ${count || 0} cached messages for user ${userId}`);
    return count || 0;
  }
}

/**
 * Create a singleton instance
 */
let messageCacheServiceInstance: MessageCacheService | null = null;

export function getMessageCacheService(): MessageCacheService {
  if (!messageCacheServiceInstance) {
    messageCacheServiceInstance = new MessageCacheService();
  }
  return messageCacheServiceInstance;
}

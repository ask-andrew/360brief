/**
 * Thread Reconstruction Service
 * 
 * Implements battle-tested email threading algorithm using:
 * 1. Message-ID and In-Reply-To headers (primary)
 * 2. References header (fallback)
 * 3. Subject-based fuzzy matching (last resort)
 * 
 * Handles Gmail's threading behavior and edge cases.
 */

import { createClient } from '@supabase/supabase-js';

export interface EmailMessage {
  id: string;
  messageId: string; // Gmail message ID
  threadId?: string; // Gmail thread ID
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  date: Date;
  inReplyTo?: string;
  references?: string[];
  headers?: Record<string, string>;
}

export interface Thread {
  id: string;
  rootMessageId: string;
  subject: string;
  participants: string[];
  messages: EmailMessage[];
  lastMessageDate: Date;
  lastSenderEmail: string;
  isUserLastSender: boolean;
  isAbandoned: boolean;
}

export class ThreadReconstructionService {
  private messageMap: Map<string, EmailMessage> = new Map();
  private threads: Map<string, Thread> = new Map();
  
  constructor(private supabase: ReturnType<typeof createClient>) {}
  
  /**
   * Reconstruct threads from a list of email messages
   */
  async reconstructThreads(
    userId: string,
    messages: EmailMessage[],
    userEmail: string
  ): Promise<Thread[]> {
    console.log(`🧵 Reconstructing threads for ${messages.length} messages...`);
    
    // Reset state
    this.messageMap.clear();
    this.threads.clear();
    
    // First pass: Index all messages by Message-ID
    for (const message of messages) {
      this.messageMap.set(message.messageId, message);
    }
    
    // Second pass: Build threads
    for (const message of messages) {
      const threadId = this.findOrCreateThread(message);
      message.threadId = threadId;
      
      // Add message to thread
      const thread = this.threads.get(threadId);
      if (!thread) {
        console.error(`❌ Thread ${threadId} not found after creation`);
        continue;
      }
      
      thread.messages.push(message);
      
      // Update thread metadata
      this.updateThreadMetadata(thread, message, userEmail);
    }
    
    // Third pass: Sort messages within each thread and finalize
    for (const thread of this.threads.values()) {
      thread.messages.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Check if thread is abandoned (no reply in > 7 days)
      const daysSinceLastMessage = 
        (Date.now() - thread.lastMessageDate.getTime()) / (1000 * 60 * 60 * 24);
      thread.isAbandoned = daysSinceLastMessage > 7;
    }
    
    console.log(`✅ Reconstructed ${this.threads.size} threads`);
    
    return Array.from(this.threads.values());
  }
  
  /**
   * Find existing thread or create new one for a message
   */
  private findOrCreateThread(message: EmailMessage): string {
    let threadId: string | null = null;
    
    // Strategy 1: Check if replying to existing message (In-Reply-To)
    if (message.inReplyTo) {
      const parentMessage = this.messageMap.get(message.inReplyTo);
      if (parentMessage?.threadId) {
        threadId = parentMessage.threadId;
      }
    }
    
    // Strategy 2: Check References header (more reliable for long threads)
    if (!threadId && message.references && message.references.length > 0) {
      for (const refId of message.references) {
        const refMessage = this.messageMap.get(refId);
        if (refMessage?.threadId) {
          threadId = refMessage.threadId;
          break;
        }
      }
    }
    
    // Strategy 3: Use Gmail's thread ID if available
    if (!threadId && message.threadId) {
      threadId = message.threadId;
    }
    
    // Strategy 4: Subject-based fuzzy matching
    if (!threadId) {
      const normalizedSubject = this.normalizeSubject(message.subject);
      threadId = this.findThreadBySubject(normalizedSubject);
    }
    
    // Strategy 5: Create new thread if none found
    if (!threadId) {
      threadId = message.messageId; // Use first message ID as thread ID
    }
    
    // Ensure thread exists in map (create if needed)
    if (!this.threads.has(threadId)) {
      this.threads.set(threadId, {
        id: threadId,
        rootMessageId: message.messageId,
        subject: message.subject,
        participants: [],
        messages: [],
        lastMessageDate: message.date,
        lastSenderEmail: message.from,
        isUserLastSender: false,
        isAbandoned: false,
      });
    }
    
    return threadId;
  }
  
  /**
   * Normalize email subject for fuzzy matching
   * Removes Re:, Fwd:, [tags], etc.
   */
  private normalizeSubject(subject: string): string {
    let normalized = subject;
    
    // Remove Re:, Fwd:, RE:, FW: prefixes
    normalized = normalized.replace(/^(Re|Fwd|RE|FW|Fw):\s*/gi, '');
    
    // Remove [tags] and (tags)
    normalized = normalized.replace(/\[.*?\]/g, '');
    normalized = normalized.replace(/\(.*?\)/g, '');
    
    // Trim and lowercase
    normalized = normalized.trim().toLowerCase();
    
    return normalized;
  }
  
  /**
   * Find thread by subject fuzzy matching
   */
  private findThreadBySubject(normalizedSubject: string): string | null {
    for (const [threadId, thread] of this.threads.entries()) {
      const threadSubject = this.normalizeSubject(thread.subject);
      if (threadSubject === normalizedSubject) {
        return threadId;
      }
    }
    return null;
  }
  
  /**
   * Update thread metadata with new message
   */
  private updateThreadMetadata(
    thread: Thread,
    message: EmailMessage,
    userEmail: string
  ): void {
    // Update participants
    const participants = new Set(thread.participants);
    participants.add(message.from);
    message.to.forEach(email => participants.add(email));
    message.cc?.forEach(email => participants.add(email));
    thread.participants = Array.from(participants);
    
    // Update last message info
    if (message.date > thread.lastMessageDate) {
      thread.lastMessageDate = message.date;
      thread.lastSenderEmail = message.from;
      thread.isUserLastSender = message.from.toLowerCase() === userEmail.toLowerCase();
    }
  }
  
  /**
   * Calculate response time between consecutive messages in a thread
   * Returns time in hours, filtering out edge cases
   */
  calculateResponseTime(
    prevMessage: EmailMessage,
    currMessage: EmailMessage
  ): number | null {
    const timeDeltaMs = currMessage.date.getTime() - prevMessage.date.getTime();
    const timeDeltaHours = timeDeltaMs / (1000 * 60 * 60);
    
    // Filter edge cases
    
    // Skip if response is > 7 days (likely abandoned thread)
    if (timeDeltaHours > 168) {
      return null;
    }
    
    // Skip if response is < 1 minute (likely automated)
    if (timeDeltaHours < 0.017) {
      return null;
    }
    
    return timeDeltaHours;
  }
  
  /**
   * Calculate response time considering only working hours (M-F, 9-5)
   * This provides a fairer comparison
   */
  calculateWorkingHoursResponseTime(
    startDate: Date,
    endDate: Date
  ): number {
    let workingHours = 0;
    const current = new Date(startDate);
    
    while (current < endDate) {
      const dayOfWeek = current.getDay();
      const hour = current.getHours();
      
      // Monday-Friday (1-5), 9 AM - 5 PM
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour < 17) {
        workingHours += 1;
      }
      
      // Advance by 1 hour
      current.setHours(current.getHours() + 1);
    }
    
    return workingHours;
  }
  
  /**
   * Save reconstructed threads to database
   */
  async saveThreads(userId: string, threads: Thread[]): Promise<void> {
    console.log(`💾 Saving ${threads.length} threads to database...`);
    
    for (const thread of threads) {
      // Insert or update thread
      const { data: threadData, error: threadError } = await this.supabase
        .from('email_threads')
        .upsert({
          user_id: userId,
          thread_id: thread.id,
          root_message_id: thread.rootMessageId,
          subject: thread.subject,
          participant_emails: thread.participants,
          message_count: thread.messages.length,
          last_message_date: thread.lastMessageDate.toISOString(),
          last_sender_email: thread.lastSenderEmail,
          is_user_last_sender: thread.isUserLastSender,
          is_abandoned: thread.isAbandoned,
        })
        .select()
        .single();
      
      if (threadError) {
        console.error(`❌ Error saving thread ${thread.id}:`, threadError);
        continue;
      }
      
      // Save thread messages with sequence numbers and response times
      for (let i = 0; i < thread.messages.length; i++) {
        const message = thread.messages[i];
        
        // Calculate response time from previous message
        let responseTimeHours: number | null = null;
        if (i > 0) {
          responseTimeHours = this.calculateResponseTime(
            thread.messages[i - 1],
            message
          );
        }
        
        // Find message_cache_id for this message
        const { data: cacheData } = await this.supabase
          .from('message_cache')
          .select('id')
          .eq('user_id', userId)
          .eq('message_id', message.messageId)
          .single();
        
        if (!cacheData) {
          console.warn(`⚠️  Message ${message.messageId} not found in cache`);
          continue;
        }
        
        // Insert thread message
        const { error: messageError } = await this.supabase
          .from('thread_messages')
          .upsert({
            thread_id: threadData.id,
            message_cache_id: cacheData.id,
            sequence_number: i + 1,
            response_time_hours: responseTimeHours,
            is_working_hours: true, // TODO: Calculate based on working hours
          });
        
        if (messageError) {
          console.error(`❌ Error saving thread message:`, messageError);
        }
      }
    }
    
    console.log(`✅ Threads saved successfully`);
  }
}

/**
 * Helper function to extract email headers from Gmail message
 */
export function extractEmailHeaders(gmailMessage: any): {
  messageId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  date: Date;
  inReplyTo?: string;
  references?: string[];
} {
  const headers = gmailMessage.payload?.headers || [];
  
  const getHeader = (name: string): string | undefined => {
    const header = headers.find(
      (h: any) => h.name.toLowerCase() === name.toLowerCase()
    );
    return header?.value;
  };
  
  const messageId = getHeader('Message-ID') || gmailMessage.id;
  const subject = getHeader('Subject') || '(No Subject)';
  const from = getHeader('From') || '';
  const to = getHeader('To')?.split(',').map(e => e.trim()) || [];
  const cc = getHeader('Cc')?.split(',').map(e => e.trim());
  const dateStr = getHeader('Date') || gmailMessage.internalDate;
  const inReplyTo = getHeader('In-Reply-To');
  const referencesStr = getHeader('References');
  
  const date = dateStr ? new Date(dateStr) : new Date();
  const references = referencesStr
    ? referencesStr.split(/\s+/).filter(r => r.length > 0)
    : undefined;
  
  return {
    messageId,
    subject,
    from,
    to,
    cc,
    date,
    inReplyTo,
    references,
  };
}

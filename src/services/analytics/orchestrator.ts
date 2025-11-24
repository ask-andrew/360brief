/**
 * Level 10 Analytics Orchestrator
 * 
 * Coordinates the entire analytics pipeline:
 * 1. Fetch messages from cache
 * 2. Reconstruct threads
 * 3. Normalize contacts
 * 4. Build timeline
 * 5. Calculate metrics
 * 
 * Implements incremental processing to avoid recomputing everything.
 */

import { createClient } from '@supabase/supabase-js';
import { ThreadReconstructionService, extractEmailHeaders } from './threadReconstruction';
import { ContactNormalizationService, parseEmailAddress } from './contactNormalization';
import { TimelineBuilderService } from './timelineBuilder';

export interface AnalyticsOrchestrationOptions {
  userId: string;
  userEmail: string;
  daysBack?: number;
  forceFullRebuild?: boolean;
}

export interface OrchestrationResult {
  success: boolean;
  threadsProcessed: number;
  contactsProcessed: number;
  timelineEventsProcessed: number;
  errors: string[];
  processingTimeMs: number;
}

export class AnalyticsOrchestrator {
  private threadService: ThreadReconstructionService;
  private contactService: ContactNormalizationService;
  private timelineService: TimelineBuilderService;
  
  constructor(private supabase: ReturnType<typeof createClient>) {
    this.threadService = new ThreadReconstructionService(supabase);
    this.contactService = new ContactNormalizationService(supabase, '');
    this.timelineService = new TimelineBuilderService(supabase);
  }
  
  /**
   * Run the full analytics pipeline
   */
  async process(options: AnalyticsOrchestrationOptions): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    console.log('\n🚀 Starting Level 10 Analytics Processing...');
    console.log(`   User: ${options.userEmail}`);
    console.log(`   Days Back: ${options.daysBack || 30}`);
    console.log(`   Force Rebuild: ${options.forceFullRebuild || false}\n`);
    
    try {
      // Update contact service with user email
      this.contactService = new ContactNormalizationService(
        this.supabase,
        options.userEmail
      );
      
      // Step 1: Load existing data (for incremental processing)
      if (!options.forceFullRebuild) {
        console.log('📂 Loading existing data...');
        await this.contactService.loadExistingContacts(options.userId);
        await this.timelineService.loadTimeline(options.userId, options.daysBack);
      }
      
      // Step 2: Fetch messages from cache
      console.log('📧 Fetching messages from cache...');
      const messages = await this.fetchMessagesFromCache(
        options.userId,
        options.daysBack || 30
      );
      
      if (messages.length === 0) {
        console.log('⚠️  No messages found in cache');
        return {
          success: true,
          threadsProcessed: 0,
          contactsProcessed: 0,
          timelineEventsProcessed: 0,
          errors: ['No messages found in cache'],
          processingTimeMs: Date.now() - startTime,
        };
      }
      
      console.log(`   Found ${messages.length} messages\n`);
      
      // Step 3: Extract email data and normalize contacts
      console.log('👥 Normalizing contacts...');
      const emailMessages = [];
      
      for (const message of messages) {
        try {
          const headers = extractEmailHeaders(message.raw_data);
          
          // Add contacts
          const fromParsed = parseEmailAddress(headers.from);
          this.contactService.addContact(fromParsed.email, fromParsed.name);
          
          for (const to of headers.to) {
            const toParsed = parseEmailAddress(to);
            this.contactService.addContact(toParsed.email, toParsed.name);
          }
          
          if (headers.cc) {
            for (const cc of headers.cc) {
              const ccParsed = parseEmailAddress(cc);
              this.contactService.addContact(ccParsed.email, ccParsed.name);
            }
          }
          
          emailMessages.push({
            id: message.id,
            messageId: headers.messageId,
            threadId: message.thread_id,
            subject: headers.subject,
            from: fromParsed.email,
            to: headers.to.map(t => parseEmailAddress(t).email),
            cc: headers.cc?.map(c => parseEmailAddress(c).email),
            date: headers.date,
            inReplyTo: headers.inReplyTo,
            references: headers.references,
          });
        } catch (error) {
          errors.push(`Error processing message ${message.id}: ${error}`);
        }
      }
      
      const contacts = this.contactService.getAllContacts();
      console.log(`   Normalized ${contacts.length} unique contacts\n`);
      
      // Step 4: Reconstruct threads
      console.log('🧵 Reconstructing email threads...');
      const threads = await this.threadService.reconstructThreads(
        options.userId,
        emailMessages,
        options.userEmail
      );
      console.log(`   Reconstructed ${threads.length} threads\n`);
      
      // Step 5: Build timeline
      console.log('📅 Building timeline...');
      this.timelineService.addEmailEvents(
        options.userId,
        options.userEmail,
        emailMessages.map(m => ({
          id: m.id,
          messageCacheId: messages.find(msg => msg.message_id === m.messageId)?.id || '',
          from: m.from,
          to: m.to,
          cc: m.cc,
          subject: m.subject,
          date: m.date,
        }))
      );
      
      const timeline = this.timelineService.getTimeline();
      console.log(`   Built timeline with ${timeline.length} events\n`);
      
      // Step 6: Save to database
      console.log('💾 Saving to database...');
      
      await this.threadService.saveThreads(options.userId, threads);
      await this.contactService.saveContacts(options.userId);
      await this.timelineService.saveTimeline(options.userId);
      
      console.log('   All data saved\n');
      
      // Step 7: Calculate basic metrics
      console.log('📊 Calculating metrics...');
      const metrics = await this.calculateBasicMetrics(
        options.userId,
        threads,
        timeline
      );
      console.log('   Metrics calculated\n');
      
      const processingTimeMs = Date.now() - startTime;
      
      console.log('✅ Processing complete!');
      console.log(`   Time: ${(processingTimeMs / 1000).toFixed(2)}s\n`);
      
      return {
        success: true,
        threadsProcessed: threads.length,
        contactsProcessed: contacts.length,
        timelineEventsProcessed: timeline.length,
        errors,
        processingTimeMs,
      };
      
    } catch (error) {
      console.error('❌ Processing failed:', error);
      errors.push(`Fatal error: ${error}`);
      
      return {
        success: false,
        threadsProcessed: 0,
        contactsProcessed: 0,
        timelineEventsProcessed: 0,
        errors,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Fetch messages from cache
   */
  private async fetchMessagesFromCache(
    userId: string,
    daysBack: number
  ): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const { data, error } = await this.supabase
      .from('message_cache')
      .select('*')
      .eq('user_id', userId)
      .gte('internal_date', startDate.toISOString())
      .order('internal_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * Calculate basic metrics (Phase 2 metrics)
   */
  private async calculateBasicMetrics(
    userId: string,
    threads: any[],
    timeline: any[]
  ): Promise<void> {
    // Calculate thread decay rate
    const totalThreads = threads.length;
    const userEndedThreads = threads.filter(t => t.isUserLastSender).length;
    const threadDecayRate = totalThreads > 0 ? userEndedThreads / totalThreads : 0;
    
    // Calculate context switches
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const contextSwitches = this.timelineService.countContextSwitches(startOfDay, today);
    
    // Calculate cognitive load by hour
    const cognitiveLoadByHour = this.timelineService.getCognitiveLoadByHour(today);
    
    // Calculate time by context
    const timeByContext = this.timelineService.getTimeByContext();
    
    // Save to daily_metrics table
    const { error } = await this.supabase
      .from('daily_metrics')
      .upsert({
        user_id: userId,
        metric_date: today.toISOString().split('T')[0],
        thread_decay_rate: threadDecayRate,
        context_switches: contextSwitches,
        cognitive_load_by_hour: cognitiveLoadByHour,
        time_by_priority: timeByContext, // Using context as proxy for priority
      });
    
    if (error) {
      console.error('Error saving metrics:', error);
    }
  }
  
  /**
   * Process incrementally (only new messages since last run)
   */
  async processIncremental(options: AnalyticsOrchestrationOptions): Promise<OrchestrationResult> {
    console.log('🔄 Running incremental processing...');
    
    // Get last processed timestamp
    const { data: lastMetric } = await this.supabase
      .from('daily_metrics')
      .select('created_at')
      .eq('user_id', options.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!lastMetric) {
      console.log('   No previous metrics found, running full rebuild');
      return this.process({ ...options, forceFullRebuild: true });
    }
    
    const lastProcessedDate = new Date(lastMetric.created_at);
    const hoursSinceLastRun = (Date.now() - lastProcessedDate.getTime()) / (1000 * 60 * 60);
    
    console.log(`   Last run: ${hoursSinceLastRun.toFixed(1)} hours ago`);
    
    // If last run was < 1 hour ago, skip
    if (hoursSinceLastRun < 1) {
      console.log('   Skipping (too recent)');
      return {
        success: true,
        threadsProcessed: 0,
        contactsProcessed: 0,
        timelineEventsProcessed: 0,
        errors: ['Skipped - last run was less than 1 hour ago'],
        processingTimeMs: 0,
      };
    }
    
    // Run full process with incremental flag
    return this.process(options);
  }
}

/**
 * Helper function to run analytics for a user
 */
export async function runAnalyticsForUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userEmail: string,
  options?: {
    daysBack?: number;
    forceFullRebuild?: boolean;
    incremental?: boolean;
  }
): Promise<OrchestrationResult> {
  const orchestrator = new AnalyticsOrchestrator(supabase);
  
  const processOptions: AnalyticsOrchestrationOptions = {
    userId,
    userEmail,
    daysBack: options?.daysBack || 30,
    forceFullRebuild: options?.forceFullRebuild || false,
  };
  
  if (options?.incremental) {
    return orchestrator.processIncremental(processOptions);
  }
  
  return orchestrator.process(processOptions);
}

/**
 * Timeline Builder Service
 * 
 * Creates a unified chronological stream of all communication events
 * (emails, meetings, slack messages) for context switch analysis and
 * cognitive load tracking.
 */

import { createClient } from '@supabase/supabase-js';

export interface TimelineEvent {
  id?: string;
  eventType: 'email_sent' | 'email_received' | 'meeting' | 'slack_message';
  eventDate: Date;
  participants: string[];
  subject: string;
  durationMinutes?: number;
  contextCategory?: 'client_work' | 'team_mgmt' | 'product' | 'operations' | 'other';
  messageCacheId?: string;
  // calendarEventId?: string; // Future
}

export interface ContextCategory {
  name: string;
  keywords: string[];
  weight: number;
}

export class TimelineBuilderService {
  private timeline: TimelineEvent[] = [];
  
  // Context categories for classification
  private contextCategories: ContextCategory[] = [
    {
      name: 'client_work',
      keywords: ['client', 'customer', 'proposal', 'contract', 'demo', 'sales'],
      weight: 1.0,
    },
    {
      name: 'team_mgmt',
      keywords: ['1:1', 'one-on-one', 'feedback', 'performance', 'hiring', 'review'],
      weight: 1.0,
    },
    {
      name: 'product',
      keywords: ['roadmap', 'feature', 'sprint', 'backlog', 'release', 'bug', 'development'],
      weight: 1.0,
    },
    {
      name: 'operations',
      keywords: ['budget', 'process', 'vendor', 'legal', 'compliance', 'admin'],
      weight: 1.0,
    },
  ];
  
  constructor(private supabase: ReturnType<typeof createClient>) {}
  
  /**
   * Add email events to timeline
   */
  addEmailEvents(
    userId: string,
    userEmail: string,
    messages: Array<{
      id: string;
      messageCacheId: string;
      from: string;
      to: string[];
      cc?: string[];
      subject: string;
      date: Date;
    }>
  ): void {
    for (const message of messages) {
      const isSent = message.from.toLowerCase() === userEmail.toLowerCase();
      const participants = [
        message.from,
        ...message.to,
        ...(message.cc || []),
      ];
      
      const event: TimelineEvent = {
        eventType: isSent ? 'email_sent' : 'email_received',
        eventDate: message.date,
        participants,
        subject: message.subject,
        messageCacheId: message.messageCacheId,
        contextCategory: this.classifyContext(message.subject),
      };
      
      this.timeline.push(event);
    }
  }
  
  /**
   * Add calendar events to timeline
   */
  addCalendarEvents(
    meetings: Array<{
      id: string;
      summary: string;
      start: Date;
      end: Date;
      attendees: string[];
    }>
  ): void {
    for (const meeting of meetings) {
      const durationMinutes = Math.round(
        (meeting.end.getTime() - meeting.start.getTime()) / (1000 * 60)
      );
      
      const event: TimelineEvent = {
        eventType: 'meeting',
        eventDate: meeting.start,
        participants: meeting.attendees,
        subject: meeting.summary,
        durationMinutes,
        contextCategory: this.classifyContext(meeting.summary),
      };
      
      this.timeline.push(event);
    }
  }
  
  /**
   * Classify event into context category using keyword matching
   * This is Tier 1 (free, instant) classification
   */
  private classifyContext(text: string): TimelineEvent['contextCategory'] {
    const lowerText = text.toLowerCase();
    
    let bestMatch: TimelineEvent['contextCategory'] = 'other';
    let bestScore = 0;
    
    for (const category of this.contextCategories) {
      let score = 0;
      
      for (const keyword of category.keywords) {
        if (lowerText.includes(keyword)) {
          score += category.weight;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = category.name as TimelineEvent['contextCategory'];
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Get timeline sorted chronologically
   */
  getTimeline(): TimelineEvent[] {
    return this.timeline.sort(
      (a, b) => a.eventDate.getTime() - b.eventDate.getTime()
    );
  }
  
  /**
   * Get timeline for a specific date range
   */
  getTimelineForRange(startDate: Date, endDate: Date): TimelineEvent[] {
    return this.timeline.filter(
      event =>
        event.eventDate >= startDate && event.eventDate <= endDate
    );
  }
  
  /**
   * Count context switches in a time period
   * A context switch occurs when consecutive events have different contexts
   */
  countContextSwitches(startDate?: Date, endDate?: Date): number {
    let events = this.getTimeline();
    
    if (startDate && endDate) {
      events = this.getTimelineForRange(startDate, endDate);
    }
    
    if (events.length < 2) {
      return 0;
    }
    
    let switches = 0;
    let prevContext = events[0].contextCategory;
    
    for (let i = 1; i < events.length; i++) {
      const currContext = events[i].contextCategory;
      if (currContext !== prevContext) {
        switches++;
      }
      prevContext = currContext;
    }
    
    return switches;
  }
  
  /**
   * Get context switches per hour for a date
   */
  getContextSwitchesByHour(date: Date): Record<number, number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const dayEvents = this.getTimelineForRange(startOfDay, endOfDay);
    
    // Group events by hour
    const eventsByHour: Record<number, TimelineEvent[]> = {};
    
    for (const event of dayEvents) {
      const hour = event.eventDate.getHours();
      if (!eventsByHour[hour]) {
        eventsByHour[hour] = [];
      }
      eventsByHour[hour].push(event);
    }
    
    // Count switches per hour
    const switchesByHour: Record<number, number> = {};
    
    for (const [hour, events] of Object.entries(eventsByHour)) {
      if (events.length < 2) {
        switchesByHour[parseInt(hour)] = 0;
        continue;
      }
      
      let switches = 0;
      let prevContext = events[0].contextCategory;
      
      for (let i = 1; i < events.length; i++) {
        const currContext = events[i].contextCategory;
        if (currContext !== prevContext) {
          switches++;
        }
        prevContext = currContext;
      }
      
      switchesByHour[parseInt(hour)] = switches;
    }
    
    return switchesByHour;
  }
  
  /**
   * Get time spent in each context
   */
  getTimeByContext(): Record<string, number> {
    const timeByContext: Record<string, number> = {
      client_work: 0,
      team_mgmt: 0,
      product: 0,
      operations: 0,
      other: 0,
    };
    
    for (const event of this.timeline) {
      const context = event.contextCategory || 'other';
      
      // For meetings, use actual duration
      if (event.eventType === 'meeting' && event.durationMinutes) {
        timeByContext[context] += event.durationMinutes;
      } else {
        // For emails, estimate 5 minutes per email
        timeByContext[context] += 5;
      }
    }
    
    return timeByContext;
  }
  
  /**
   * Calculate cognitive load score for a time window
   * Combines: meeting density + email volume + context switches
   */
  calculateCognitiveLoad(
    startDate: Date,
    endDate: Date
  ): number {
    const events = this.getTimelineForRange(startDate, endDate);
    
    if (events.length === 0) {
      return 0;
    }
    
    // Count meetings
    const meetingCount = events.filter(e => e.eventType === 'meeting').length;
    
    // Count emails
    const emailCount = events.filter(
      e => e.eventType === 'email_sent' || e.eventType === 'email_received'
    ).length;
    
    // Count context switches
    const switches = this.countContextSwitches(startDate, endDate);
    
    // Calculate total meeting time
    const totalMeetingMinutes = events
      .filter(e => e.eventType === 'meeting')
      .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
    
    // Weighted score
    const score =
      meetingCount * 3.0 + // Meetings are high cognitive load
      emailCount * 0.5 + // Emails are moderate load
      switches * 2.0 + // Context switches are expensive
      totalMeetingMinutes * 0.1; // Meeting duration
    
    return score;
  }
  
  /**
   * Get cognitive load by hour for a date
   */
  getCognitiveLoadByHour(date: Date): Record<number, number> {
    const loadByHour: Record<number, number> = {};
    
    for (let hour = 0; hour < 24; hour++) {
      const startOfHour = new Date(date);
      startOfHour.setHours(hour, 0, 0, 0);
      
      const endOfHour = new Date(date);
      endOfHour.setHours(hour, 59, 59, 999);
      
      loadByHour[hour] = this.calculateCognitiveLoad(startOfHour, endOfHour);
    }
    
    return loadByHour;
  }
  
  /**
   * Save timeline to database
   */
  async saveTimeline(userId: string): Promise<void> {
    console.log(`💾 Saving ${this.timeline.length} timeline events...`);
    
    for (const event of this.timeline) {
      const { error } = await this.supabase
        .from('events_timeline')
        .upsert({
          id: event.id,
          user_id: userId,
          event_type: event.eventType,
          event_date: event.eventDate.toISOString(),
          participants: event.participants,
          subject: event.subject,
          duration_minutes: event.durationMinutes,
          context_category: event.contextCategory,
          message_cache_id: event.messageCacheId,
        });
      
      if (error) {
        console.error('❌ Error saving timeline event:', error);
      }
    }
    
    console.log('✅ Timeline saved successfully');
  }
  
  /**
   * Load timeline from database
   */
  async loadTimeline(userId: string, daysBack: number = 30): Promise<void> {
    console.log(`📅 Loading timeline for last ${daysBack} days...`);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const { data: events, error } = await this.supabase
      .from('events_timeline')
      .select('*')
      .eq('user_id', userId)
      .gte('event_date', startDate.toISOString())
      .order('event_date', { ascending: true });
    
    if (error) {
      console.error('❌ Error loading timeline:', error);
      return;
    }
    
    this.timeline = (events || []).map(e => ({
      id: e.id,
      eventType: e.event_type,
      eventDate: new Date(e.event_date),
      participants: e.participants,
      subject: e.subject,
      durationMinutes: e.duration_minutes,
      contextCategory: e.context_category,
      messageCacheId: e.message_cache_id,
    }));
    
    console.log(`✅ Loaded ${this.timeline.length} timeline events`);
  }
  
  /**
   * Add custom context category
   */
  addContextCategory(category: ContextCategory): void {
    this.contextCategories.push(category);
  }
  
  /**
   * Update context categories from user preferences
   */
  updateContextCategories(categories: ContextCategory[]): void {
    this.contextCategories = categories;
  }
}

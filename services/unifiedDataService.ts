// services/unifiedDataService.ts
import { google, gmail_v1, calendar_v3 } from 'googleapis';
import { userTokens } from './db';
import { OAuth2Client } from 'google-auth-library';
import { DateTime, Interval } from 'luxon';

// Utility for retrying operations with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 60000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on 4xx errors except 429 (too many requests)
      if (error.code >= 400 && error.code < 500 && error.code !== 429) {
        break;
      }
      
      if (attempt === maxRetries) break;
      
      // Calculate delay with exponential backoff and jitter
      const backoff = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitter = Math.floor(Math.random() * 1000);
      const delay = backoff + jitter;
      
      console.warn(`Attempt ${attempt} failed (${error.message}). Retrying in ${Math.round(delay/1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Unknown error in retryWithBackoff');
};

// Cache implementation - moved to a separate file to avoid duplicates

// Import our types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GEMINI_API_KEY?: string;
    }
  }
}

export interface EmailData {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
  labels?: string[];
  hasAttachment?: boolean;
  isRead?: boolean;
  isStarred?: boolean;
  gmailLink: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    self?: boolean;
  }>;
  creator?: { email: string; displayName?: string };
  organizer?: { email: string; displayName?: string };
  hangoutLink?: string;
  conferenceData?: any;
  reminders?: any;
  eventType?: string;
  status?: string;
  htmlLink?: string;
  created: string;
  updated: string;
}

export interface UnifiedBriefData {
  metadata: {
    userId: string;
    timeRange: {
      start: string;
      end: string;
      timeZone: string;
    };
    generatedAt: string;
  };
  overview: {
    emailStats: {
      received: number;
      sent: number;
      unread: number;
      pendingReply: number;
      avgResponseTime: number;
    };
    meetingStats: {
      total: number;
      duration: number;
      withActionItems: number;
    };
  };
  priorities: {
    urgent: Array<{
      id: string;
      type: 'email' | 'meeting' | 'task';
      title: string;
      source: string;
      dueDate?: string;
      status: 'action-required' | 'follow-up' | 'review';
      participants?: Array<{
        name: string;
        email: string;
        role?: string;
      }>;
    }>;
    upcoming: Array<{
      id: string;
      type: 'meeting' | 'deadline' | 'reminder';
      title: string;
      date: string;
      description?: string;
      participants?: string[];
    }>;
  };
  emailAnalytics: {
    volumeOverTime: Array<{
      date: string;
      received: number;
      sent: number;
    }>;
    topSenders: Array<{
      name: string;
      email: string;
      count: number;
      lastContact: string;
      sentiment?: 'positive' | 'neutral' | 'negative';
    }>;
    pendingResponses: Array<{
      id: string;
      subject: string;
      from: string;
      received: string;
      snippet: string;
      threadId: string;
    }>;
    emailAnalysis: Array<{
      id: string;
      sentiment: {
        score: number; // -1 to 1
        label: 'positive' | 'neutral' | 'negative';
        confidence: number;
      };
      priority: 'high' | 'medium' | 'low';
      topics: string[];
      isActionRequired: boolean;
      timeToRespond?: number; // in hours
    }>;
  };
  meetingAnalytics: {
    upcomingMeetings: Array<{
      id: string;
      title: string;
      time: string;
      duration: number;
      participants: string[];
      hasPrepMaterials: boolean;
      calendarLink?: string;
    }>;
    recentMeetings: Array<{
      id: string;
      title: string;
      time: string;
      duration: number;
      participants: Array<{
        name: string;
        email: string;
        status: 'accepted' | 'declined' | 'tentative';
      }>;
      actionItems?: Array<{
        text: string;
        assignee?: string;
        dueDate?: string;
      }>;
    }>;
  };
  insights: {
    keyThemes: Array<{
      name: string;
      sentiment: 'positive' | 'neutral' | 'negative';
      frequency: number;
      relatedItems: Array<{
        type: 'email' | 'meeting' | 'document';
        id: string;
        title: string;
        date: string;
      }>;
    }>;
    sentimentTrend: Array<{
      date: string;
      score: number;
    }>;
  };
  actionItems: Array<{
    id: string;
    text: string;
    source: {
      type: 'email' | 'meeting' | 'manual';
      id: string;
      title: string;
      date: string;
    };
    status: 'open' | 'in-progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
    assignee?: string;
    lastUpdated: string;
  }>;
}

export interface EmailAnalysis {
  sentiment: {
    score: number; // -1 to 1
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
  };
  priority: 'high' | 'medium' | 'low';
  topics: string[];
  isActionRequired: boolean;
  timeToRespond?: number; // in hours
}

// Common words to filter out from key themes
const commonWords = new Set([
  'this', 'that', 'with', 'have', 'from', 'your', 'will', 'would', 'they',
  'what', 'about', 'which', 'when', 'there', 'their', 'could', 'some', 'into',
  'other', 'than', 'then', 'them', 'these', 'were', 'like', 'just',
  'also', 'more', 'most', 'over', 'only', 'very', 'after', 'before', 'between'
]);

export class UnifiedDataService {
  private oauth2Client: OAuth2Client;
  private gmail: gmail_v1.Gmail;
  private calendar: calendar_v3.Calendar;
  private cache: InMemoryCache;

  constructor(oauth2Client: OAuth2Client) {
    this.oauth2Client = oauth2Client;
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    this.cache = new InMemoryCache();
  }

  async getUnifiedBriefData(userId: string): Promise<UnifiedBriefData> {
    const cacheKey = `brief-data-${userId}`;
    const timeZone = 'America/Chicago'; // TODO: Get from user preferences
    
    // Try to get from cache first
    const cachedData = await this.cache.get<UnifiedBriefData>(cacheKey);
    if (cachedData) {
      console.log('Returning cached brief data');
      return cachedData;
    }

    console.log('Generating new brief data...');
    
    // Calculate time range (last 7 days)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch data from different sources in parallel
    const [emails, calendarEvents] = await Promise.all([
      this.fetchEmails(startDate, endDate, userId),
      this.fetchCalendarEvents(startDate, endDate, userId, timeZone)
    ]);

    // Process data into our unified model
    const unifiedData: UnifiedBriefData = {
      metadata: {
        userId,
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          timeZone
        },
        generatedAt: new Date().toISOString()
      },
      overview: this.processOverview(emails, calendarEvents),
      priorities: this.extractPriorities(emails, calendarEvents),
      emailAnalytics: this.analyzeEmails(emails),
      meetingAnalytics: this.analyzeMeetings(calendarEvents, timeZone),
      insights: this.generateInsights(emails, calendarEvents),
      actionItems: this.extractActionItems(emails, calendarEvents)
    };

    // Cache the result for 15 minutes
    await this.cache.set(cacheKey, unifiedData, 15 * 60);
    
    return unifiedData;
  }

  // Utility to create an authenticated Google OAuth2 client
  private getGoogleOAuth2Client(refreshToken: string) {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      throw new Error('Missing Google OAuth environment variables');
    }
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
  }

  private  async fetchEmails(startDate: Date, endDate: Date, userId: string): Promise<EmailData[]> {
    try {
      console.log(`Fetching emails from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // 1. Retrieve refresh token from Supabase
      console.log('[UnifiedDataService.fetchEmails] Fetching token for user:', userId);
      const tokenResult = await userTokens.get(userId, 'google');
      console.log('[UnifiedDataService.fetchEmails] Token fetch result:', tokenResult ? 'Token found' : 'No token found');
      
      if (!tokenResult?.refreshToken) {
        throw new Error(`No Google refresh token found for user ${userId}`);
      }
      
      // 2. Create OAuth2 client with the refresh token
      const oauth2Client = this.getGoogleOAuth2Client(tokenResult.refreshToken);
      
      // 3. Get a fresh access token with retry logic
      await retryWithBackoff(async () => {
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          console.log('[UnifiedDataService.fetchEmails] Successfully refreshed access token');
          oauth2Client.setCredentials(credentials);
          return true;
        } catch (tokenError: any) {
          console.error('[UnifiedDataService.fetchEmails] Error refreshing access token:', tokenError);
          throw new Error(`Failed to refresh access token: ${tokenError.message}`);
        }
      }, 3, 1000, 10000);
      
      // 4. Create Gmail client with the authenticated OAuth2 client
      const gmail = google.gmail({ 
        version: 'v1', 
        auth: oauth2Client,
        // Add rate limiting configuration
        retryConfig: {
          retry: 3,
          httpMethodsToRetry: ['GET', 'POST', 'PUT', 'DELETE'],
          noResponseRetries: 2,
          retryDelay: 1000,
          statusCodesToRetry: [[100, 199], [429, 429], [500, 599]]
        }
      });
      
      // 5. Format dates for Gmail query (UNIX timestamp in seconds)
      const formatForGmail = (date: Date) => Math.floor(date.getTime() / 1000).toString();
      
      // 6. Search for emails in the date range with retry logic
      const res = await retryWithBackoff(async () => {
        try {
          const result = await gmail.users.messages.list({
            userId: 'me',
            q: `after:${formatForGmail(startDate)} before:${formatForGmail(endDate)}`,
            maxResults: 50, // Reduced from 100 to stay under quota
            quotaUser: userId // Helps with quota tracking
          });
          return result;
        } catch (error: any) {
          if (error.code === 403 && error.message?.includes('Quota exceeded')) {
            console.warn('Gmail API quota exceeded. Please increase your quota.');
            return { data: { messages: [] } }; // Return empty result instead of failing
          }
          throw error; // Re-throw to trigger retry
        }
      });

      if (!res.data.messages || res.data.messages.length === 0) {
        console.log('No emails found in the specified date range');
        return [];
      }

      console.log(`Found ${res.data.messages.length} emails, fetching details...`);
      
      // Process messages in batches to avoid hitting rate limits
      const BATCH_SIZE = 20;
      const messageBatches = [];
      for (let i = 0; i < res.data.messages.length; i += BATCH_SIZE) {
        messageBatches.push(res.data.messages.slice(i, i + BATCH_SIZE));
      }
      
      const allMessages: any[] = [];
      
      // Process each batch with a small delay
      for (const [index, batch] of messageBatches.entries()) {
        console.log(`Processing batch ${index + 1}/${messageBatches.length}`);
        
        const batchPromises = batch.map(msg => 
          retryWithBackoff(() => 
            gmail.users.messages.get({
              userId: 'me',
              id: msg.id!,
              format: 'metadata',
              metadataHeaders: ['From', 'To', 'Subject', 'Date', 'Message-ID']
            })
          )
        );
        
        const messages = await Promise.all(batchPromises);
        allMessages.push(...messages);
        
        // Add delay between batches if not the last batch
        if (index < messageBatches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Transform Gmail messages to our EmailData format
      return allMessages
        .filter(msg => msg?.data)
        .map(msg => this.transformGmailMessage(msg.data));
      
    } catch (error: any) {
      console.error('Error in fetchEmails:', {
        error: error.message,
        code: error.code,
        status: error.response?.status,
        details: error.response?.data?.error?.details,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      
      // Return empty array to allow the application to continue with other data
      return [];
    }
  }

  private transformGmailMessage(message: gmail_v1.Schema$Message): EmailData {
    const getHeader = (name: string) => {
      const header = message.payload?.headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    const id = message.id || '';
    const threadId = message.threadId || '';
    const subject = getHeader('Subject') || 'No Subject';
    const from = getHeader('From') || 'Unknown Sender';
    const to = getHeader('To') || '';
    const date = getHeader('Date') || new Date().toISOString();
    const snippet = message.snippet || '';
    const labels = message.labelIds || [];
    const hasAttachment = message.payload?.parts?.some((part) => part.filename && part.filename.trim() !== '') || false;
    const isRead = !message.labelIds?.includes('UNREAD');
    const isStarred = message.labelIds?.includes('STARRED') || false;

    return {
      id,
      threadId,
      subject,
      from,
      to,
      date,
      snippet,
      labels,
      hasAttachment,
      isRead,
      isStarred,
      gmailLink: `https://mail.google.com/mail/u/0/#inbox/${id}`
    };
  }

  private async fetchCalendarEvents(
    startDate: Date,
    endDate: Date,
    userId: string,
    timeZone: string
  ): Promise<CalendarEvent[]> {
    try {
      console.log(`Fetching calendar events from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // 1. Retrieve refresh token from Supabase
      console.log('[UnifiedDataService.fetchCalendarEvents] Fetching token for user:', userId);
      const tokenResult = await userTokens.get(userId, 'google');
      console.log('[UnifiedDataService.fetchCalendarEvents] Token fetch result:', tokenResult ? 'Token found' : 'No token found');
      
      if (!tokenResult?.refreshToken) {
        throw new Error(`No Google refresh token found for user ${userId}`);
      }
      
      // 2. Create OAuth2 client with the refresh token
      const oauth2Client = this.getGoogleOAuth2Client(tokenResult.refreshToken);
      
      // 3. Get a fresh access token
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log('[UnifiedDataService.fetchCalendarEvents] Successfully refreshed access token');
        // Update the access token in the client
        oauth2Client.setCredentials(credentials);
      } catch (tokenError: any) {
        console.error('[UnifiedDataService.fetchCalendarEvents] Error refreshing access token:', tokenError);
        throw new Error(`Failed to refresh access token: ${tokenError.message}`);
      }
      
      // 4. Create Calendar client with the authenticated OAuth2 client
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      // 5. Fetch events from Google Calendar API using the new client with refreshed credentials
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        timeZone,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50
      });

      if (!res.data.items || res.data.items.length === 0) {
        console.log('No calendar events found in the specified date range');
        return [];
      }

      console.log(`Found ${res.data.items.length} calendar events`);
      return res.data.items as CalendarEvent[];
      
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error(`Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private processOverview(emails: EmailData[], events: CalendarEvent[]) {
    // Count received and sent emails with better filtering
    const receivedEmails = emails.filter(email => {
      // Email is received if it's not from me and not in SENT folder
      return !email.from.includes('me@') && !email.labels?.includes('SENT');
    });
    
    const sentEmails = emails.filter(email => {
      // Email is sent if it's from me or in SENT folder
      return email.from.includes('me@') || email.labels?.includes('SENT');
    });
    
    // Calculate response times for received emails that have been replied to
    let totalResponseTime = 0;
    let responseCount = 0;
    
    receivedEmails.forEach(email => {
      if (email.labels?.includes('INBOX') && !email.labels?.includes('IMPORTANT')) {
        // This is a simplified response time calculation
        // In a real app, you'd match threads to get actual response times
        const receivedTime = new Date(email.date).getTime();
        const now = Date.now();
        const hoursSinceReceived = (now - receivedTime) / (1000 * 60 * 60);
        
        if (hoursSinceReceived < 24) { // Only count emails from last 24h
          totalResponseTime += hoursSinceReceived;
          responseCount++;
        }
      }
    });
    
    // Calculate meeting stats
    const now = new Date();
    const upcomingEvents = events.filter(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date || 0);
      return eventStart > now;
    });
    
    const pastEvents = events.filter(event => {
      const eventEnd = new Date(event.end.dateTime || event.end.date || 0);
      return eventEnd <= now;
    });
    
    return {
      emailStats: {
        received: receivedEmails.length,
        sent: sentEmails.length,
        unread: emails.filter(e => !e.isRead && !e.labels?.includes('SENT')).length,
        pendingReply: emails.filter(e => 
          !e.isRead && 
          !e.labels?.includes('SENT') && 
          !e.labels?.includes('IMPORTANT')
        ).length,
        avgResponseTime: responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0
      },
      meetingStats: {
        total: events.length,
        upcoming: upcomingEvents.length,
        past: pastEvents.length,
        duration: Math.round(events.reduce((total, event) => {
          const start = new Date(event.start.dateTime || event.start.date || 0);
          const end = new Date(event.end.dateTime || event.end.date || 0);
          return total + (end.getTime() - start.getTime()) / (1000 * 60); // in minutes
        }, 0)),
        withActionItems: pastEvents.filter(event => 
          event.description?.toLowerCase().includes('action item') ||
          event.description?.toLowerCase().includes('todo')
        ).length
      }
    };
  }

  private extractPriorities(emails: EmailData[], events: CalendarEvent[]) {
    const urgent: UnifiedBriefData['priorities']['urgent'] = [];
    const upcoming: UnifiedBriefData['priorities']['upcoming'] = [];

    // Process emails for urgent items
    emails.forEach(email => {
      const analysis = this.analyzeEmailContent(email);
      if (analysis.priority === 'high' && analysis.isActionRequired) {
        urgent.push({
          id: email.id,
          type: 'email' as const,
          title: email.subject || 'No subject',
          source: 'email',
          dueDate: email.date,
          status: 'action-required',
          participants: email.from ? [{
            name: email.from.split('<')[0].trim(),
            email: email.from.match(/<([^>]+)>/)?.[1] || email.from
          }] : []
        });
      }
    });

    // Process calendar events for upcoming items
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);

    events.forEach(event => {
      const startDate = new Date(event.start.dateTime || event.start.date!);
      if (startDate > now && startDate <= oneWeekFromNow) {
        upcoming.push({
          id: event.id,
          type: 'meeting' as const,
          title: event.summary || 'No title',
          date: startDate.toISOString(),
          description: event.description,
          participants: event.attendees?.map(a => a.email) || []
        });
      }
    });

    return { urgent, upcoming };
  }

  private analyzeEmails(emails: EmailData[]): {
    volumeOverTime: Array<{ date: string; received: number; sent: number }>;
    topSenders: Array<{ name: string; email: string; count: number; lastContact: string }>;
    pendingResponses: Array<{ id: string; subject: string; from: string; received: string; snippet: string; threadId: string }>;
    emailAnalysis: Array<{
      id: string;
      sentiment: { score: number; label: 'positive' | 'neutral' | 'negative'; confidence: number };
      priority: 'high' | 'medium' | 'low';
      topics: string[];
      isActionRequired: boolean;
      timeToRespond?: number;
    }>;
  } {
    // Group emails by date (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    
    // Initialize volume over time with zeros
    const volumeOverTime = last7Days.map(date => ({
      date,
      received: 0,
      sent: 0
    }));
    
    // Process each email
    emails.forEach(email => {
      const emailDate = new Date(email.date).toISOString().split('T')[0];
      const dayIndex = last7Days.findIndex(d => d === emailDate);
      
      if (dayIndex !== -1) {
        if (email.from.includes('me@') || email.labels?.includes('SENT')) {
          volumeOverTime[dayIndex].sent++;
        } else {
          volumeOverTime[dayIndex].received++;
        }
      }
    });
    
    // Get top senders (excluding self and common email services)
    const commonDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'google.com'];
    const senderCounts = emails
      .filter(email => {
        const from = email.from.toLowerCase();
        return (
          !from.includes('me@') && 
          !from.includes('no-reply') &&
          !commonDomains.some(domain => from.endsWith(`@${domain}`))
        );
      })
      .reduce((acc, email) => {
        const from = email.from;
        if (!acc[from]) {
          acc[from] = { count: 0, lastDate: '' };
        }
        acc[from].count++;
        if (email.date > acc[from].lastDate) {
          acc[from].lastDate = email.date;
        }
        return acc;
      }, {} as Record<string, { count: number; lastDate: string }>);
    
    const topSenders = Object.entries(senderCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([from, data]) => ({
        name: from.split('<')[0].trim() || from.split('@')[0],
        email: from.split('<')[1]?.replace('>', '') || from,
        count: data.count,
        lastContact: data.lastDate
      }));
    
    // Find emails that need a response
    const pendingResponses = emails
      .filter(email => {
        return (
          !email.from.includes('me@') && 
          !email.labels?.includes('SENT') &&
          !email.labels?.includes('IMPORTANT') &&
          !email.labels?.includes('STARRED') &&
          !email.isRead
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(email => ({
        id: email.id,
        subject: email.subject || '(No subject)',
        from: email.from,
        received: email.date,
        snippet: email.snippet || '',
        threadId: email.threadId
      }));
    
    // Analyze email content for sentiment and priority
    const emailAnalysis = emails
      .slice(0, 50) // Limit analysis to most recent 50 emails for performance
      .map(email => this.analyzeEmailContent(email));
    
    return {
      volumeOverTime,
      topSenders,
      pendingResponses,
      emailAnalysis
    };
  }

  private analyzeEmailContent(email: EmailData): EmailAnalysis {
    // Simple implementation - in a real app, use NLP for better analysis
    const sentiment = this.analyzeSentiment(email.snippet || '');
    const priority = this.detectPriority(email);
    const topics = this.extractTopics(email.snippet || '');
    
    return {
      id: email.id,
      sentiment,
      priority,
      topics,
      isActionRequired: priority === 'high' || this.containsActionItems(email),
      timeToRespond: this.calculateTimeToRespond(email)
    };
  }

  private detectPriority(email: EmailData): 'high' | 'medium' | 'low' {
    const highPriorityKeywords = ['urgent', 'asap', 'important', 'immediate', 'today'];
    const mediumPriorityKeywords = ['review', 'follow up', 'when you get a chance'];
    
    const content = (email.subject + ' ' + (email.snippet || '')).toLowerCase();
    
    if (highPriorityKeywords.some(keyword => content.includes(keyword))) {
      return 'high';
    }
    
    if (mediumPriorityKeywords.some(keyword => content.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  private extractTopics(text: string): string[] {
    // Simple topic extraction - in a real app, use NLP libraries
    const commonWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'have', 'has', 'had', 'are', 'is', 'was', 'were', 'be', 'been', 'being']);
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    
    // Count word frequencies
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get top 5 most frequent words as topics
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private containsActionItems(email: EmailData): boolean {
    const actionKeywords = ['action', 'todo', 'task', 'follow up', 'please review', 'needs your attention'];
    const content = (email.subject + ' ' + (email.snippet || '')).toLowerCase();
    return actionKeywords.some(keyword => content.includes(keyword));
  }

  private calculateTimeToRespond(email: EmailData): number | undefined {
    if (!email.date) return undefined;
    const receivedDate = new Date(email.date);
    const now = new Date();
    return (now.getTime() - receivedDate.getTime()) / (1000 * 60 * 60); // hours
  }

  private analyzeSentiment(text: string): { score: number; label: 'positive' | 'neutral' | 'negative'; confidence: number } {
    // Simple sentiment analysis implementation
    const positiveWords = ['great', 'good', 'excellent', 'thanks', 'thank you', 'appreciate', 'awesome', 'perfect'];
    const negativeWords = ['bad', 'poor', 'issue', 'problem', 'urgent', 'concern', 'terrible', 'broken'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) {
        score += 1;
        positiveCount += 1;
      }
      if (negativeWords.includes(word)) {
        score -= 1;
        negativeCount += 1;
      }
    });
    
    // Normalize score to -1 to 1 range
    const normalizedScore = Math.max(-1, Math.min(1, score / 5));
    
    // Calculate confidence based on word matches
    const totalMatches = positiveCount + negativeCount;
    const confidence = totalMatches > 0 ? Math.min(1, totalMatches / 10) : 0.3; // Base confidence if no matches
    
    // Determine label based on score
    let label: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (normalizedScore > 0.2) label = 'positive';
    else if (normalizedScore < -0.2) label = 'negative';
    
    return {
      score: normalizedScore,
      label,
      confidence: Math.max(0.3, Math.min(1, confidence)) // Ensure confidence is between 0.3 and 1
    };
  }

  private extractActionItems(emails: EmailData[], events: CalendarEvent[]): Array<{
    id: string;
    text: string;
    source: {
      type: 'email' | 'meeting' | 'manual';
      id: string;
      title: string;
      date: string;
    };
    status: 'open' | 'in-progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
    assignee?: string;
    lastUpdated: string;
  }> {
    const actionItems: Array<{
      id: string;
      text: string;
      source: {
        type: 'email' | 'meeting' | 'manual';
        id: string;
        title: string;
        date: string;
      };
      status: 'open' | 'in-progress' | 'completed';
      priority: 'high' | 'medium' | 'low';
      dueDate?: string;
      assignee?: string;
      lastUpdated: string;
    }> = [];

    // Extract action items from emails
    emails.forEach(email => {
      // Simple extraction - in a real app, use NLP to identify action items
      const actionKeywords = ['action', 'todo', 'task', 'follow up', 'please review', 'needs your attention'];
      const content = (email.subject + ' ' + (email.snippet || '')).toLowerCase();
      
      if (actionKeywords.some(keyword => content.includes(keyword))) {
        actionItems.push({
          id: `email-${email.id}`,
          text: `Action from email: ${email.subject}`,
          source: {
            type: 'email',
            id: email.id,
            title: email.subject || 'No subject',
            date: email.date || new Date().toISOString()
          },
          status: 'open',
          priority: this.detectPriority(email),
          lastUpdated: new Date().toISOString()
        });
      }
    });

    // Extract action items from calendar events
    events.forEach(event => {
      if (event.description) {
        const actionItemRegex = /(?:TODO|ACTION|TASK):\s*(.*?)(?:\n|$)/gi;
        let match;
        
        while ((match = actionItemRegex.exec(event.description)) !== null) {
          const actionText = match[1].trim();
          const assigneeMatch = actionText.match(/@([\w.@]+)/);
          const dueDateMatch = actionText.match(/due: (\d{4}-\d{2}-\d{2})/i);
          
          actionItems.push({
            id: `event-${event.id}-${actionItems.length}`,
            text: actionText.replace(/@[\w.@]+/g, '').replace(/due: \d{4}-\d{2}-\d{2}/i, '').trim(),
            source: {
              type: 'meeting',
              id: event.id,
              title: event.summary || 'No title',
              date: event.start?.dateTime || new Date().toISOString()
            },
            status: 'open',
            priority: 'medium',
            assignee: assigneeMatch ? assigneeMatch[1] : undefined,
            dueDate: dueDateMatch ? dueDateMatch[1] : undefined,
            lastUpdated: new Date().toISOString()
          });
        }
      }
    });

    return actionItems;

    // Extract action items from emails
    emails.forEach(email => {
      const analysis = this.analyzeEmailContent(email);
      if (analysis.isActionRequired) {
        actionItems.push({
          id: `email-${email.id}`,
          type: 'email',
          title: email.subject || 'No subject',
          dueDate: email.date,
          status: 'pending',
          priority: analysis.priority,
          source: 'email'
        });
      }
    });

    // Extract action items from calendar events
    events.forEach(event => {
      const actionItemsFromEvent = this.extractActionItemsFromEvent(event);
      actionItemsFromEvent.forEach((item, index) => {
        actionItems.push({
          id: `event-${event.id}-${index}`,
          type: 'meeting',
          title: `${event.summary || 'Meeting'}: ${item.text}`,
          dueDate: item.dueDate,
          status: 'pending',
          priority: 'medium',
          source: 'calendar'
        });
      });
    });

    return actionItems;
  }

  /**
   * Generate insights from emails and calendar events
   * @param emails Array of email data
   * @param events Array of calendar events
   * @returns Object containing key themes and sentiment trends
   */
  private generateInsights(
    emails: EmailData[],
    events: CalendarEvent[]
  ): UnifiedBriefData['insights'] {
    // 1. Extract key themes from email subjects and meeting titles
    const allText = [
      ...emails.map(e => e.subject || ''),
      ...events.map(e => e.summary || '')
    ].join(' ').toLowerCase();

    // Simple word frequency analysis (could be enhanced with NLP in the future)
    const wordCounts = allText
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
      .reduce((counts, word) => {
        counts[word] = (counts[word] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

    // Get top 5 themes
    const topThemes = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, frequency]) => ({
        name,
        sentiment: this.analyzeSentiment(allText).score > 0 ? 'positive' : 
                 this.analyzeSentiment(allText).score < 0 ? 'negative' : 'neutral',
        frequency,
        relatedItems: [
          ...emails
            .filter(e => e.subject?.toLowerCase().includes(name))
            .map(e => ({
              type: 'email' as const,
              id: e.id,
              title: e.subject || 'No subject',
              date: e.date
            })),
          ...events
            .filter(e => e.summary?.toLowerCase().includes(name))
            .map(e => ({
              type: 'meeting' as const,
              id: e.id,
              title: e.summary || 'No title',
              date: e.start.dateTime
            }))
        ].slice(0, 3) // Limit to top 3 related items per theme
      }));

    // 2. Calculate sentiment trend over time (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const sentimentTrend = [];
    for (let d = new Date(sevenDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().split('T')[0];
      const dayEmails = emails.filter(e => e.date && e.date.startsWith(dayStr));
      const dayEvents = events.filter(e => {
        if (!e.start) return false;
        // Handle both date and dateTime formats
        const eventDate = e.start.dateTime || e.start.date;
        return eventDate && eventDate.startsWith(dayStr);
      });
      
      if (dayEmails.length === 0 && dayEvents.length === 0) continue;
      
      const emailSentiments = dayEmails
        .map(e => this.analyzeEmailContent(e).sentiment?.score || 0)
        .filter(score => score !== 0);
      
      const eventSentiments = dayEvents
        .map(e => {
          const text = [e.summary, e.description].filter(Boolean).join(' ');
          return text ? this.analyzeSentiment(text).score : 0;
        })
        .filter(score => score !== 0);
      
      const totalItems = emailSentiments.length + eventSentiments.length;
      const avgSentiment = totalItems > 0 
        ? [...emailSentiments, ...eventSentiments].reduce((sum, score) => sum + score, 0) / totalItems 
        : 0;
      
      sentimentTrend.push({
        date: dayStr,
        score: parseFloat(avgSentiment.toFixed(2))
      });
    }

    return {
      keyThemes: topThemes,
      sentimentTrend
    };
  }
}

// Cache implementation
interface CachedData<T = any> {
  value: T;
  expiresAt?: number;
}

class InMemoryCache<T = any> {
  private store = new Map<string, CachedData<T>>();

  async get(key: string): Promise<T | null> {
    const data = this.store.get(key);
    if (!data) return null;
    
    if (data.expiresAt && Date.now() > data.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return data.value;
  }

  async set(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined
    });
  }
}

export const cache = new InMemoryCache();
'use client';

import { Session } from '@supabase/supabase-js';

// Types
export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  description?: string;
  location?: string;
  attendees?: Array<{
    email: string;
    responseStatus: string;
    self?: boolean;
  }>;
  htmlLink?: string;
  status?: string;
  creator?: {
    email: string;
    self?: boolean;
  };
  organizer?: {
    email: string;
    self?: boolean;
  };
}

export interface EmailHeader {
  name: string;
  value: string;
}

export interface EmailPayload {
  headers: EmailHeader[];
  body?: {
    data?: string;
  };
  parts?: EmailPayload[];
  mimeType?: string;
}

export interface Email {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: EmailPayload;
  internalDate: string;
}

export interface EmailListResponse {
  messages: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

// Utility function to get header value from email payload
const getHeader = (headers: EmailHeader[] = [], name: string): string => {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
};

export class GoogleAPIService {
  private static readonly CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
  private static readonly GMAIL_API = 'https://www.googleapis.com/gmail/v1';

  /**
   * Creates an authenticated fetch request with the provided access token
   */
  private static async fetchWithAuth(
    url: string,
    accessToken: string,
    options: RequestInit = {}
  ) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        ...(options.method !== 'GET' && { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`Google API request failed: ${response.status} ${response.statusText} - ${error}`);
    }
    return response;
  }

  /**
   * Fetches calendar events for the authenticated user
   */
  static async getCalendarEvents(
    accessToken: string,
    timeMin: string = new Date().toISOString(),
    timeMax: string = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxResults: number = 10
  ): Promise<CalendarEvent[]> {
    const url = new URL(`${this.CALENDAR_API}/users/me/calendar/events`);
    url.searchParams.append('timeMin', timeMin);
    url.searchParams.append('timeMax', timeMax);
    url.searchParams.append('maxResults', maxResults.toString());
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');

    const response = await this.fetchWithAuth(url.toString(), accessToken);
    const data = await response.json() as { items?: CalendarEvent[] };
    return data.items || [];
  }

  static async getEmails(
    accessToken: string, 
    maxResults: number = 10,
    labelIds: string[] = ['INBOX', 'IMPORTANT'],
    query: string = ''
  ): Promise<Email[]> {
    const url = new URL(`${this.GMAIL_API}/users/me/messages`);
    url.searchParams.append('maxResults', maxResults.toString());
    url.searchParams.append('labelIds', labelIds.join(','));
    url.searchParams.append('q', query);

    const response = await this.fetchWithAuth(url.toString(), accessToken);
    const listData = await response.json() as EmailListResponse;

    if (!listData.messages || listData.messages.length === 0) {
      return [];
    }

    // Then, fetch each message's details in parallel
    const messagePromises = listData.messages.map(msg => 
      this.fetchWithAuth(
        `${this.GMAIL_API}/users/me/messages/${msg.id}?format=full`,
        accessToken
      ).then(res => res.json() as Promise<Email>)
    );

    return Promise.all(messagePromises);
  }

  static async getUpcomingEventsAndEmails(session: Session) {
    if (!session?.provider_token) {
      throw new Error('No active session or access token');
    }

    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(now.getDate() + 7);

    const [events, emails] = await Promise.all([
      this.getCalendarEvents(
        session.provider_token,
        now.toISOString(),
        weekFromNow.toISOString()
      ),
      this.getEmails(session.provider_token, 10)
    ]);

    return { events, emails };
  }
}

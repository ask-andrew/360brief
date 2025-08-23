import { Session } from '@supabase/supabase-js';

interface GoogleApiError extends Error {
  error?: {
    message?: string;
    code?: number;
  };
}

export class GoogleApiClient {
  private static async fetchWithAuth<T>(
    url: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: GoogleApiError = new Error(
        errorData.error?.message || 'Failed to fetch data from Google API'
      );
      error.error = errorData.error;
      throw error;
    }

    return response.json();
  }

  static async getCalendarEvents(accessToken: string, timeMin: string, timeMax: string) {
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('timeMin', timeMin);
    url.searchParams.append('timeMax', timeMax);
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');
    url.searchParams.append('maxResults', '10');

    const data = await this.fetchWithAuth<{ items: any[] }>(url.toString(), accessToken);
    return data.items || [];
  }

  static async getEmails(accessToken: string, maxResults: number = 10) {
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    url.searchParams.append('maxResults', maxResults.toString());

    const { messages = [] } = await this.fetchWithAuth<{ messages: Array<{ id: string }> }>(
      url.toString(), 
      accessToken
    );
    
    const emailPromises = messages.map((message) => 
      this.fetchWithAuth<Email>(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, accessToken)
    );

    return Promise.all(emailPromises);
  }
}

interface Email {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
  };
  internalDate: string;
}

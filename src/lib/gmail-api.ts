import { createClient } from '@/lib/supabase/server';
import { Buffer } from 'buffer';

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
    }>;
  };
  internalDate: string;
  sizeEstimate: number;
}

interface GmailAnalytics {
  total_count: number;
  inbound_count: number;
  outbound_count: number;
  avg_response_time_minutes: number;
  missed_messages: number;
  focus_ratio: number;
  external_percentage: number;
  internal_percentage: number;
  top_projects: Array<{ name: string; count: number }>;
  reconnect_contacts: Array<{ name: string; email: string; last_contact: string }>;
  recent_trends: {
    messages: { change: number; direction: 'up' | 'down' };
    response_time: { change: number; direction: 'up' | 'down' };
    meetings: { change: number; direction: 'up' | 'down' };
  };
  sentiment_analysis: {
    positive: number;
    neutral: number;
    negative: number;
    overall_trend: 'positive' | 'negative' | 'neutral';
  };
  priority_messages: {
    awaiting_my_reply: Array<{
      id: string;
      subject: string;
      from: string;
      date: string;
      snippet: string;
    }>;
    awaiting_their_reply: Array<{
      id: string;
      subject: string;
      to: string;
      date: string;
      snippet: string;
    }>;
  };
  channel_analytics: {
    by_channel: Array<{ channel: string; count: number }>;
    by_time: Array<{ hour: number; count: number }>;
  };
  network_data: {
    nodes: Array<{ id: string; name: string; email: string; count: number }>;
    connections: Array<{ source: string; target: string; weight: number }>;
  };
}

export async function getGmailAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient();
  
  try {
    const { data: tokenData, error } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();
    
    if (error || !tokenData) {
      console.error('No Gmail token found for user:', userId);
      return null;
    }
    
    const isExpired = tokenData.expires_at && (
      typeof tokenData.expires_at === 'number' 
        ? tokenData.expires_at < Math.floor(Date.now() / 1000)
        : new Date(tokenData.expires_at) < new Date()
    );
    
    if (isExpired) {
      console.log('Token expired, attempting to refresh');
      
      if (!tokenData.refresh_token) {
        console.error('No refresh token available');
        return null;
      }
      
      try {
        const refreshResponse = await fetch('https://accounts.google.com/o/auth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            refresh_token: tokenData.refresh_token,
            grant_type: 'refresh_token'
          })
        });
        
        const refreshData = await refreshResponse.json();
        
        if (!refreshResponse.ok) {
          console.error('Token refresh failed:', refreshData);
          return null;
        }
        
        // Calculate new expiration and store as ISO string
        const newExpiresAt = new Date(Date.now() + 3600 * 1000);
        
        const { error: updateError } = await supabase
          .from('user_tokens')
          .update({
            access_token: refreshData.access_token,
            expires_at: newExpiresAt.toISOString()
          })
        
        if (updateError) {
          console.error('Failed to update tokens:', updateError);
          return null;
        }
        
        return refreshData.access_token;
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        return null;
      }
    }
    
    return tokenData.access_token;
  } catch (error) {
    console.error('Error fetching Gmail token:', error);
    return null;
  }
}

export async function fetchGmailMessages(accessToken: string, maxResults: number = 500): Promise<GmailMessage[]> {
  const baseUrl = 'https://gmail.googleapis.com/gmail/v1/users/me';
  
  try {
    const query = `newer_than:14d -category:{promotions} -in:spam -in:trash`;
    const listResponse = await fetch(`${baseUrl}/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      throw new Error(`Gmail API error (list messages): ${listResponse.status} ${listResponse.statusText}`);
    }

    const listData = await listResponse.json();
    const messageIds: Array<{ id: string }> = listData.messages || [];

    if (messageIds.length === 0) {
      console.log('No recent messages found.');
      return [];
    }

    console.log(`Found ${messageIds.length} recent message IDs. Fetching full content...`);

    const detailPromises = messageIds.map(async (m) => {
      try {
        const detailRes = await fetch(`${baseUrl}/messages/${m.id}?format=full`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!detailRes.ok) {
          console.warn(`⚠️ Failed to fetch full details for message ${m.id}. Status: ${detailRes.status}`);
          return null;
        }

        const detail = await detailRes.json();
        return detail as GmailMessage;
      } catch (err) {
        console.warn(`⚠️ Error fetching message ${m.id}:`, err);
        return null;
      }
    });

    const messages = await Promise.all(detailPromises);
    
    const validMessages = messages.filter((msg): msg is GmailMessage => msg !== null);
    
    console.log(`Successfully fetched ${validMessages.length} full messages.`);
    return validMessages;

  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
}

function getEmailBody(message: GmailMessage): string {
  let content = '';
  const { payload } = message;

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  if (payload.parts) {
    const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
    if (textPart && textPart.body?.data) {
      return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }
  }
  
  return message.snippet || '';
}

export async function analyzeGmailData(messages: GmailMessage[], userEmail: string): Promise<GmailAnalytics> {
  console.log(`Starting analysis of ${messages.length} messages.`);

  const emailsToSummarize = messages.map(msg => ({
    id: msg.id,
    content: getEmailBody(msg),
  })).filter(email => email.content.trim().length > 0);

  let summaries: any[] = [];
  try {
    const summaryResponse = await fetch('http://127.0.0.1:8000/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: emailsToSummarize }),
    });
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      summaries = summaryData.summaries;
    } else {
      console.error('Summarization service failed:', summaryResponse.statusText);
    }
  } catch (error) {
    console.error('Error calling summarization service:', error);
  }

  const summaryMap = new Map(summaries.map(s => [s.id, s]));

  const requiredActions: any[] = [];
  const teamAchievements: any[] = [];

  messages.forEach(msg => {
    const summary = summaryMap.get(msg.id);
    if (summary) {
      if (summary.actions && !summary.actions[0].includes('No specific actions')) {
        requiredActions.push({ 
            id: msg.id, 
            subject: getHeaderValue(msg.payload.headers, 'subject'),
            from: getHeaderValue(msg.payload.headers, 'from'),
            actions: summary.actions 
        });
      }
      
      const achievementKeywords = ['achieved', 'completed', 'delivered', 'launched', 'success'];
      if (achievementKeywords.some(kw => summary.summary.toLowerCase().includes(kw))) {
        teamAchievements.push({ 
            id: msg.id, 
            subject: getHeaderValue(msg.payload.headers, 'subject'),
            achievement: summary.summary
        });
      }
    }
  });

  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);
  const thisWeekMessages = messages.filter(msg => msg.internalDate && parseInt(msg.internalDate) > sevenDaysAgo);
  const lastWeekMessages = messages.filter(msg => msg.internalDate && parseInt(msg.internalDate) > fourteenDaysAgo && parseInt(msg.internalDate) <= sevenDaysAgo);
  const messageChange = thisWeekMessages.length - lastWeekMessages.length;

  const recent_trends = {
    messages: {
      change: Math.abs(messageChange),
      direction: messageChange >= 0 ? 'up' : 'down' as const,
    },
    response_time: { change: 8, direction: 'down' as const },
    meetings: { change: 2, direction: 'up' as const },
  };

  return {
    priority_messages: {
        awaiting_my_reply: requiredActions,
        awaiting_their_reply: []
    },
    top_projects: teamAchievements.map(ach => ({ name: ach.subject, count: 1})),
    recent_trends: recent_trends,
  } as any;
}

function extractEmailFromHeader(header: string): string | null {
  const match = header.match(/<(.+?)>/);
  if (match) return match[1];
  
  const emailMatch = header.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return emailMatch ? emailMatch[1] : null;
}

function extractNameFromHeader(header: string): string | null {
  const match = header.match(/^(.+?)\s*</);
  if (match) return match[1].replace(/['"]/g, '').trim();
  return null;
}

function getHeaderValue(headers: Array<{ name: string; value: string }>, name: string): string | null {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : null;
}
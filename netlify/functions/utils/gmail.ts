import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    parts?: Array<{
      mimeType: string;
      body: { data?: string };
      parts?: Array<{ mimeType: string; body: { data?: string } }>;
    }>;
    body?: {
      data?: string;
    };
  };
}

export async function getUnreadEmails(accessToken: string, maxResults = 10) {
  try {
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth });

    // Get list of unread messages
    const { data: { messages = [] } } = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX', 'UNREAD'],
      maxResults,
    });

    if (!messages.length) {
      return [];
    }

    // Get full message details for each message
    const messagePromises = messages.map(async (message) => {
      const { data } = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full',
      });
      return data as GmailMessage;
    });

    const fullMessages = await Promise.all(messagePromises);

    // Process messages to extract relevant information
    return fullMessages.map((message) => {
      const headers = message.payload.headers || [];
      const fromHeader = headers.find((h) => h.name === 'From');
      const subjectHeader = headers.find((h) => h.name === 'Subject');
      const dateHeader = headers.find((h) => h.name === 'Date');

      // Try to extract the sender's name and email
      let from = fromHeader?.value || 'Unknown Sender';
      const fromMatch = from.match(/"?([^"]*)"?\s*<(.+)>/);
      const senderName = fromMatch ? fromMatch[1] || fromMatch[2] : from;
      const senderEmail = fromMatch ? fromMatch[2] : from;

      // Try to extract plain text content
      let body = '';
      const parts = message.payload.parts || [];
      
      const findPlainText = (parts: any[]): string => {
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
          if (part.parts) {
            const text = findPlainText(part.parts);
            if (text) return text;
          }
        }
        return '';
      };

      body = findPlainText(parts);
      if (!body && message.payload.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      }

      return {
        id: message.id,
        threadId: message.threadId,
        subject: subjectHeader?.value || '(No subject)',
        snippet: message.snippet,
        from: {
          name: senderName,
          email: senderEmail,
        },
        date: dateHeader?.value || new Date(parseInt(message.internalDate)).toISOString(),
        body: body.substring(0, 500) + (body.length > 500 ? '...' : ''), // Limit body length
        isUnread: message.labelIds?.includes('UNREAD') || false,
      };
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw new Error('Failed to fetch emails');
  }
}

export async function getGoogleAuthUrl(redirectUri: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

export async function getGoogleTokens(code: string, redirectUri: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

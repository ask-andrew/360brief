import { google } from 'googleapis';
import { getValidAccessToken } from '@/lib/gmail/oauth';

// Types for Gmail API responses
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
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

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  from: {
    name: string;
    email: string;
  };
  to: string;
  date: string;
  labels: string[];
  isUnread: boolean;
  body: string;
}

/**
 * Fetches unread emails from Gmail
 * @param userId User ID
 * @param maxResults Maximum number of results to return (default: 10)
 * @returns Array of email messages
 */
export async function fetchUnreadEmails(userId: string, maxResults = 10): Promise<EmailMessage[]> {
  try {
    const accessToken = await getValidAccessToken(userId);
    
    const gmail = google.gmail({
      version: 'v1',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

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
    return fullMessages.map(processGmailMessage);
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw new Error('Failed to fetch emails');
  }
}

/**
 * Processes a Gmail message into a more usable format
 */
function processGmailMessage(message: GmailMessage): EmailMessage {
  const headers = message.payload.headers || [];
  const fromHeader = headers.find((h) => h.name === 'From');
  const toHeader = headers.find((h) => h.name === 'To');
  const subjectHeader = headers.find((h) => h.name === 'Subject');
  const dateHeader = headers.find((h) => h.name === 'Date');

  // Extract sender information
  let from = fromHeader?.value || 'Unknown Sender';
  const fromMatch = from.match(/"?([^"]*)"?\s*<(.+)>/);
  const senderName = fromMatch ? fromMatch[1] || fromMatch[2] : from;
  const senderEmail = fromMatch ? fromMatch[2] : from;

  // Extract email body
  let body = '';
  const parts = message.payload.parts || [];
  
  // Helper function to find plain text in message parts
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
  
  // If no plain text found, try to get HTML body
  if (!body) {
    const findHtml = (parts: any[]): string => {
      for (const part of parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.parts) {
          const html = findHtml(part.parts);
          if (html) return html;
        }
      }
      return '';
    };
    
    const html = findHtml(parts);
    if (html) {
      // Simple HTML to text conversion (remove tags)
      body = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  // If still no body, use the snippet
  if (!body && message.snippet) {
    body = message.snippet;
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
    to: toHeader?.value || '',
    date: dateHeader?.value || new Date(parseInt(message.internalDate)).toISOString(),
    labels: message.labelIds || [],
    isUnread: message.labelIds?.includes('UNREAD') || false,
    body: body, // Return full body content for analysis
  };
}

/**
 * Marks an email as read
 */
export async function markAsRead(userId: string, messageId: string): Promise<void> {
  try {
    const accessToken = await getValidAccessToken(userId);
    
    const gmail = google.gmail({
      version: 'v1',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  } catch (error) {
    console.error('Error marking email as read:', error);
    throw new Error('Failed to mark email as read');
  }
}

/**
 * Fetches email threads from Gmail
 */
export async function fetchEmailThreads(userId: string, maxResults = 10): Promise<any[]> {
  try {
    const accessToken = await getValidAccessToken(userId);
    
    const gmail = google.gmail({
      version: 'v1',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { data: { threads = [] } } = await gmail.users.threads.list({
      userId: 'me',
      maxResults,
      q: 'in:inbox',
    });

    if (!threads.length) {
      return [];
    }

    // Get full thread details
    const threadPromises = threads.map(async (thread) => {
      const { data } = await gmail.users.threads.get({
        userId: 'me',
        id: thread.id!,
        format: 'full',
      });
      return data;
    });

    return Promise.all(threadPromises);
  } catch (error) {
    console.error('Error fetching email threads:', error);
    throw new Error('Failed to fetch email threads');
  }
}

/**
 * Sends an email using the Gmail API
 */
export async function sendEmail(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  try {
    const accessToken = await getValidAccessToken(userId);
    
    const gmail = google.gmail({
      version: 'v1',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Create email message
    const emailLines = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body,
    ];

    const email = emailLines.join('\r\n').trim();
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

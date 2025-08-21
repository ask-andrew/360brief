import { Resend } from 'resend';
import { WeeklyDigestEmail } from '@/emails/WeeklyDigestEmail';
import { render } from '@react-email/render';
import { EmailMessage } from '@/lib/gmail/client';
import { CalendarEvent } from '@/lib/calendar/client';

// Lazy-initialize Resend to avoid throwing during build when API key is missing
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

interface SendDigestParams {
  to: string;
  userName?: string;
  dateRange: string;
  emails: EmailMessage[];
  events: CalendarEvent[];
  baseUrl?: string;
}

export async function sendWeeklyDigest({
  to,
  userName,
  dateRange,
  emails = [],
  events = [],
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://360brief.app',
}: SendDigestParams) {
  try {
    const resend = getResend();
    if (!resend) {
      // Skip sending if no key configured; prevents build-time failures
      console.warn('RESEND_API_KEY not set; skipping digest email send.');
      return { success: false, skipped: true } as any;
    }
    // Process emails and events to match the WeeklyDigestEmail props
    const importantEmails = emails
      .filter(email => isImportantEmail(email))
      .slice(0, 5) // Limit to top 5 important emails
      .map(email => ({
        subject: email.subject || '(No subject)',
        from: email.from.name || email.from.email || 'Unknown Sender',
        snippet: email.snippet?.substring(0, 200) + (email.snippet?.length > 200 ? '...' : '') || '',
        date: new Date(email.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      }));

    const upcomingEvents = events
      .filter(event => new Date(event.start.dateTime) > new Date())
      .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime())
      .slice(0, 5) // Limit to next 5 events
      .map(event => ({
        summary: event.summary || 'Untitled Event',
        start: new Date(event.start.dateTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        end: new Date(event.end.dateTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        location: event.location,
      }));

    // Generate insights
    const insights = generateInsights(emails, events);

    // Render the email component to HTML
    const emailHtml = await render(
      <WeeklyDigestEmail
        userName={userName}
        dateRange={dateRange}
        summary={{
          emailCount: emails.length,
          eventCount: events.length,
          importantItems: importantEmails.length,
        }}
        insights={insights}
        recentEmails={importantEmails}
        upcomingEvents={upcomingEvents}
        baseUrl={baseUrl}
      />
    );

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: '360Brief <digest@360brief.app>',
      to,
      subject: `Your Weekly Brief - ${dateRange}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending digest email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send weekly digest:', error);
    throw error;
  }
}

// Helper function to determine if an email is important
function isImportantEmail(email: EmailMessage): boolean {
  const importantKeywords = [
    'urgent', 'important', 'action required', 'follow up', 'deadline',
    'meeting', 'review', 'approval', 'reminder', 'confidential'
  ];

  const subject = email.subject?.toLowerCase() || '';
  const snippet = email.snippet?.toLowerCase() || '';
  const from = email.from.email?.toLowerCase() || '';

  // Check if from important domains
  const importantDomains = [
    'company.com', 'team.org', 'important-client.com'
  ];
  const isFromImportantDomain = importantDomains.some(domain => 
    from.endsWith(`@${domain}`)
  );

  // Check for important keywords in subject or snippet
  const hasImportantKeywords = importantKeywords.some(keyword => 
    subject.includes(keyword) || snippet.includes(keyword)
  );

  return isFromImportantDomain || hasImportantKeywords;
}

// Helper function to generate insights from emails and events
function generateInsights(emails: EmailMessage[], events: CalendarEvent[]) {
  // Get top email senders
  const senderCounts = emails.reduce((acc, email) => {
    const sender = email.from.name || email.from.email || 'Unknown Sender';
    acc[sender] = (acc[sender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSenders = Object.entries(senderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3) // Top 3 senders
    .map(([name, count]) => ({ name, count }));

  // Find busiest day
  const dayCounts = emails.reduce((acc, email) => {
    const day = new Date(email.date).toLocaleDateString('en-US', { weekday: 'long' });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const busiestDay = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Calculate total meeting hours
  const meetingHours = events.reduce((total, event) => {
    const start = new Date(event.start.dateTime).getTime();
    const end = new Date(event.end.dateTime).getTime();
    return total + (end - start) / (1000 * 60 * 60); // Convert ms to hours
  }, 0);

  return {
    topSenders,
    busiestDay,
    meetingHours: Math.round(meetingHours * 10) / 10, // Round to 1 decimal
  };
}

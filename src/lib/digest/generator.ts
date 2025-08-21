import { EmailMessage } from '@/lib/gmail/client';
import { CalendarEvent } from '@/lib/calendar/client';
import { format, startOfWeek, endOfWeek, isThisWeek, isToday, isTomorrow, addDays } from 'date-fns';

export interface DigestContent {
  dateRange: string;
  summary: {
    emailCount: number;
    eventCount: number;
    importantItems: number;
  };
  emails: {
    id: string;
    subject: string;
    from: string;
    snippet: string;
    date: string;
    isImportant: boolean;
  }[];
  events: {
    id: string;
    summary: string;
    start: string;
    end: string;
    location?: string;
    isToday: boolean;
    isTomorrow: boolean;
  }[];
  insights: {
    topSenders: Array<{ name: string; count: number }>;
    busiestDay: string;
    meetingHours: number;
  };
}

/**
 * Generates a weekly digest from emails and calendar events
 */
export async function generateWeeklyDigest(
  emails: EmailMessage[],
  events: CalendarEvent[],
  userId: string
): Promise<DigestContent> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

  // Filter emails from the current week
  const weeklyEmails = emails.filter(email => {
    const emailDate = new Date(email.date);
    return emailDate >= weekStart && emailDate <= weekEnd;
  });

  // Process emails
  const processedEmails = weeklyEmails.map(email => ({
    id: email.id,
    subject: email.subject || '(No subject)',
    from: email.from.name || email.from.email,
    snippet: email.snippet || '',
    date: format(new Date(email.date), 'MMM d, yyyy h:mm a'),
    isImportant: isImportantEmail(email)
  }));

  // Process events
  const processedEvents = events.map(event => ({
    id: event.id,
    summary: event.summary || 'Untitled Event',
    start: format(new Date(event.start.dateTime), 'MMM d, yyyy h:mm a'),
    end: format(new Date(event.end.dateTime), 'h:mm a'),
    location: event.location,
    isToday: isToday(new Date(event.start.dateTime)),
    isTomorrow: isTomorrow(new Date(event.start.dateTime))
  }));

  // Generate insights
  const insights = generateInsights(weeklyEmails, events);

  return {
    dateRange: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`,
    summary: {
      emailCount: weeklyEmails.length,
      eventCount: events.length,
      importantItems: processedEmails.filter(e => e.isImportant).length
    },
    emails: processedEmails,
    events: processedEvents,
    insights
  };
}

/**
 * Determines if an email is important based on certain criteria
 */
function isImportantEmail(email: EmailMessage): boolean {
  // Check for common important indicators
  const importantKeywords = [
    'urgent', 'important', 'action required', 'follow up', 'deadline',
    'meeting', 'review', 'approval', 'reminder', 'confidential'
  ];

  const subject = email.subject?.toLowerCase() || '';
  const snippet = email.snippet?.toLowerCase() || '';
  const from = email.from.email.toLowerCase();

  // Check if from important contacts (simplified example)
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

/**
 * Generates insights from emails and events
 */
function generateInsights(emails: EmailMessage[], events: CalendarEvent[]) {
  // Get top email senders
  const senderCounts = emails.reduce((acc, email) => {
    const sender = email.from.name || email.from.email;
    acc[sender] = (acc[sender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSenders = Object.entries(senderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Find busiest day
  const dayCounts = emails.reduce((acc, email) => {
    const day = format(new Date(email.date), 'EEEE');
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
    meetingHours: Math.round(meetingHours * 10) / 10 // Round to 1 decimal
  };
}

/**
 * Formats the digest as HTML for email
 */
export function formatDigestAsHTML(digest: DigestContent): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { border-bottom: 2px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
        .email, .event { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
        .important { border-left: 3px solid #ff9800; padding-left: 10px; }
        .insights { display: flex; justify-content: space-between; flex-wrap: wrap; }
        .insight-item { flex: 1; min-width: 150px; margin: 0 10px 10px 0; background: #f9f9f9; padding: 10px; border-radius: 5px; }
        .footer { margin-top: 30px; text-align: center; color: #777; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Your Weekly Digest</h1>
        <p>${digest.dateRange}</p>
      </div>

      <div class="summary">
        <p>📧 <strong>${digest.summary.emailCount} emails</strong> this week</p>
        <p>📅 <strong>${digest.summary.eventCount} events</strong> scheduled</p>
        <p>⚠️ <strong>${digest.summary.importantItems} important items</strong> need your attention</p>
      </div>

      <div class="section">
        <h2 class="section-title">📊 Insights</h2>
        <div class="insights">
          <div class="insight-item">
            <h3>Top Senders</h3>
            <ul>
              ${digest.insights.topSenders.map(s => `<li>${s.name} (${s.count})</li>`).join('')}
            </ul>
          </div>
          <div class="insight-item">
            <h3>Busiest Day</h3>
            <p>${digest.insights.busiestDay}</p>
          </div>
          <div class="insight-item">
            <h3>Meeting Hours</h3>
            <p>${digest.insights.meetingHours} hours</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">📧 Important Emails</h2>
        ${digest.emails
          .filter(e => e.isImportant)
          .map(email => `
            <div class="email ${email.isImportant ? 'important' : ''}">
              <h3>${email.subject}</h3>
              <p><em>From:</em> ${email.from} • ${email.date}</p>
              <p>${email.snippet}</p>
            </div>
          `)
          .join('')}
      </div>

      <div class="section">
        <h2 class="section-title">📅 Upcoming Events</h2>
        ${digest.events
          .filter(e => e.isToday || e.isTomorrow)
          .map(event => `
            <div class="event">
              <h3>${event.summary}</h3>
              <p>${event.start} - ${event.end} ${event.location ? `• ${event.location}` : ''}</p>
              <span style="color: #666;">${event.isToday ? 'Today' : 'Tomorrow'}</span>
            </div>
          `)
          .join('')}
      </div>

      <div class="footer">
        <p>This is an automated digest. You're receiving this because you're subscribed to weekly updates.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences">Manage your email preferences</a></p>
      </div>
    </body>
    </html>
  `;
}

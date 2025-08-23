import { CalendarEvent, Email } from '@/services/google-api';

export interface BriefInput {
  events: CalendarEvent[];
  emails: Email[];
  userId: string;
  style?: 'management_consulting' | 'mission_brief' | 'startup_velocity' | 'newsletter';
  version?: 'concise' | 'detailed';
}

export function transformToBrief({
  events,
  emails,
  userId,
  style = 'management_consulting',
  version = 'detailed',
}: BriefInput) {
  const now = new Date();
  
  // Process events
  const processedEvents = events.map(event => ({
    id: event.id,
    title: event.summary,
    start: event.start.dateTime,
    end: event.end.dateTime,
    description: event.description,
    location: event.location,
    attendees: event.attendees?.map(attendee => ({
      email: attendee.email,
      status: attendee.responseStatus,
      isOrganizer: attendee.self
    })),
    isAllDay: !event.start.dateTime, // If no dateTime, it's an all-day event
    status: event.status
  }));

  // Process emails
  const processedEmails = emails.map(email => {
    const from = email.payload.headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
    const to = email.payload.headers.find(h => h.name.toLowerCase() === 'to')?.value || '';
    const subject = email.payload.headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
    const date = email.payload.headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
    
    return {
      id: email.id,
      threadId: email.threadId,
      from,
      to,
      subject,
      date,
      snippet: email.snippet,
      labels: email.labelIds,
      hasAttachment: email.payload.parts?.some(part => part.filename && part.filename.length > 0) || false
    };
  });

  // Generate the brief based on style and version
  const brief = {
    userId,
    generatedAt: now.toISOString(),
    style,
    version,
    audience: {
      to: [userId],
      from: '360Brief AI'
    },
    subject: `Your ${style === 'management_consulting' ? 'Strategic' : 'Daily'} Brief - ${now.toLocaleDateString()}`,
    tldr: generateTLDR(processedEvents, processedEmails, style),
    context: {
      events: processedEvents,
      emails: processedEmails,
      // Add more context as needed based on the style
    },
    // Add style-specific sections
    ...(style === 'management_consulting' && {
      consulting: generateConsultingSection(processedEvents, processedEmails)
    }),
    // Add other style-specific sections as needed
  };

  return brief;
}

function generateTLDR(events: any[], emails: any[], style: string): string {
  const eventCount = events.length;
  const emailCount = emails.length;
  const importantEmails = emails.filter(e => e.labels?.includes('IMPORTANT') || e.labels?.includes('STARRED'));
  
  switch (style) {
    case 'management_consulting':
      return `Today's strategic overview: ${eventCount} key meetings, ${importantEmails.length} priority communications requiring attention.`;
    case 'mission_brief':
      return `SITREP: ${eventCount} scheduled operations, ${importantEmails.length} priority messages.`;
    case 'startup_velocity':
      return `Daily pulse: ${eventCount} meetings, ${emailCount} new messages. Key metrics tracking needed.`;
    case 'newsletter':
      return `Your daily digest: ${eventCount} events, ${emailCount} messages. Top stories inside.`;
    default:
      return `Daily update: ${eventCount} events, ${emailCount} emails processed.`;
  }
}

function generateConsultingSection(events: any[], emails: any[]) {
  // This is a simplified example - you'd want to add more sophisticated analysis here
  const highPriorityEmails = emails.filter(e => e.labels?.includes('IMPORTANT'));
  const upcomingMeetings = events.filter(e => new Date(e.start) > new Date());
  
  return {
    executiveSummary: `Your briefing highlights ${upcomingMeetings.length} key meetings and ${highPriorityEmails.length} high-priority communications.`,
    situationAnalysis: {
      keyMeetings: upcomingMeetings.map(m => ({
        title: m.title,
        time: m.start,
        participants: m.attendees?.length || 0,
        isHighPriority: m.title?.toLowerCase().includes('review') || false
      })),
      priorityCommunications: highPriorityEmails.map(e => ({
        from: e.from,
        subject: e.subject,
        received: e.date,
        requiresResponse: !e.subject?.toLowerCase().startsWith('re:') && !e.subject?.toLowerCase().startsWith('fw:')
      }))
    },
    recommendations: [
      {
        priority: 'high',
        action: 'Review and respond to high-priority communications',
        rationale: 'Time-sensitive matters require attention',
        estimatedTime: '30 minutes'
      },
      {
        priority: 'medium',
        action: 'Prepare for upcoming meetings',
        rationale: 'Adequate preparation improves meeting outcomes',
        estimatedTime: '20 minutes per meeting'
      }
    ]
  };
}

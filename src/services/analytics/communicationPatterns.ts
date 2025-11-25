import { format } from 'date-fns';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'late_night';
type DayType = 'weekday' | 'weekend';

interface CommunicationPatterns {
  timeOfDay: {
    [key in TimeOfDay]: {
      sentiment: number;
      wordCount: number;
      responseTime: number;
      messageCount: number;
    };
  };
  recipientPatterns: Array<{
    email: string;
    name: string;
    sentiment: number;
    responseTime: number;
    topicClusters: string[];
    bestTimeToContact: string;
    messageCount: number;
  }>;
  sentimentTriggers: {
    positive: string[];
    negative: string[];
  };
  communicationHabits: {
    fastestResponseTime: string;
    mostEngagedRecipients: string[];
    sentimentByDay: Record<string, { sentiment: number; count: number }>;
  };
}

interface AnalyzeOptions {
  weeks?: number; // default 2
  userEmail?: string; // used to detect inbound/outbound
}

interface GmailHeader { name: string; value: string }
interface GmailMessageLite {
  id: string;
  labelIds?: string[];
  snippet?: string;
  payload: { headers: GmailHeader[] };
  internalDate?: string; // epoch millis as string
}

import { getGmailAccessToken, fetchGmailMessages } from '@/lib/gmail-api';

export async function analyzeCommunicationPatterns(
  userId: string,
  options: AnalyzeOptions = {}
): Promise<CommunicationPatterns> {
  const weeks = Math.max(1, Math.min(4, options.weeks ?? 2));
  const userEmail = (options.userEmail || '').toLowerCase();

  // Acquire Gmail token
  const accessToken = await getGmailAccessToken(userId);
  if (!accessToken) {
    throw new Error('Gmail not connected');
  }

  // Fetch recent messages (cap to 200 for performance)
  const rawMessages = await fetchGmailMessages(accessToken, 200);

  const now = Date.now();
  const cutoff = now - weeks * 7 * 24 * 60 * 60 * 1000;

  // Helper: header lookup
  const getHeader = (headers: GmailHeader[], name: string) =>
    headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  // Filter last N weeks and non-marketing
  const messages = rawMessages
    .filter(m => {
      const ts = m.internalDate ? parseInt(m.internalDate, 10) : now;
      return ts >= cutoff;
    })
    .filter(m => {
      const headers = m.payload?.headers || [];
      const subject = getHeader(headers, 'Subject').toLowerCase();
      const listUnsub = getHeader(headers, 'List-Unsubscribe');
      const from = getHeader(headers, 'From').toLowerCase();
      const labels = m.labelIds || [];
      const isPromo = labels.includes('CATEGORY_PROMOTIONS') || labels.includes('SPAM');
      const marketingDomains = ['noreply', 'no-reply', 'donotreply', 'newsletter', 'marketing'];
      const marketing = isPromo || !!listUnsub || marketingDomains.some(d => from.includes(d)) || subject.includes('unsubscribe');
      return !marketing;
    }) as GmailMessageLite[];

  // Process time-of-day patterns
  const timeOfDay: CommunicationPatterns['timeOfDay'] = {
    morning: { sentiment: 0, wordCount: 0, responseTime: 0, messageCount: 0 },
    afternoon: { sentiment: 0, wordCount: 0, responseTime: 0, messageCount: 0 },
    evening: { sentiment: 0, wordCount: 0, responseTime: 0, messageCount: 0 },
    late_night: { sentiment: 0, wordCount: 0, responseTime: 0, messageCount: 0 },
  };

  // Process recipient data structure
  interface RecipientData {
    email: string;
    name: string;
    sentiment: number;
    responseTimes: number[];
    topics: Set<string>;
    messageCount: number;
    timestamps: number[];
  }
  const recipientMap = new Map<string, RecipientData>();
  const sentimentTriggers = {
    positive: new Set<string>(),
    negative: new Set<string>(),
  };

  const daySentiment: Record<string, { sum: number; count: number }> = {};
  
  // Process each message
  messages?.forEach((m) => {
    const headers = m.payload.headers || [];
    const dateStr = getHeader(headers, 'Date');
    const date = dateStr ? new Date(dateStr) : (m.internalDate ? new Date(parseInt(m.internalDate, 10)) : new Date());
    const hour = date.getHours();
    const day = format(date, 'EEEE');

    // Determine recipient/from
    const toHeader = getHeader(headers, 'To');
    const fromHeader = getHeader(headers, 'From');
    const subject = getHeader(headers, 'Subject') || '';
    const body = (m.snippet || '').toString();

    // Heuristic sentiment from keywords
    const posHits = extractPositiveTriggers(subject + ' ' + body).length;
    const negHits = extractNegativeTriggers(subject + ' ' + body).length;
    const sentimentScore = Math.max(-1, Math.min(1, (posHits - negHits) / 3));

    // Categorize by time of day
    let timeCategory: TimeOfDay;
    if (hour >= 5 && hour < 12) timeCategory = 'morning';
    else if (hour >= 12 && hour < 17) timeCategory = 'afternoon';
    else if (hour >= 17 && hour < 22) timeCategory = 'evening';
    else timeCategory = 'late_night';

    // Update time of day stats
    timeOfDay[timeCategory].sentiment += sentimentScore;
    timeOfDay[timeCategory].wordCount += (subject.split(/\s+/).length + body.split(/\s+/).length);
    timeOfDay[timeCategory].messageCount += 1;

    // Determine primary counterparty (prefer the other side of the conversation)
    const isOutbound = userEmail && fromHeader.includes(userEmail);
    const counterpartyHeader = isOutbound ? toHeader : fromHeader;
    const counterpartyEmail = extractEmail(counterpartyHeader) || (counterpartyHeader || '').toLowerCase();
    const counterpartyName = extractName(counterpartyHeader) || (counterpartyEmail.split('@')[0] || 'Unknown');

    if (!recipientMap.has(counterpartyEmail)) {
      recipientMap.set(counterpartyEmail, {
        email: counterpartyEmail,
        name: counterpartyName,
        sentiment: 0,
        responseTimes: [] as number[],
        topics: new Set<string>(),
        messageCount: 0,
        timestamps: [] as number[],
      });
    }

    const recipientData = recipientMap.get(counterpartyEmail)!;
    recipientData.sentiment += sentimentScore;
    recipientData.messageCount += 1;
    recipientData.timestamps.push(date.getTime());

    const topics = extractTopics(subject + ' ' + body);
    topics.forEach((t) => recipientData.topics.add(t));

    if (sentimentScore > 0.3) {
      extractPositiveTriggers(body).forEach((t) => sentimentTriggers.positive.add(t));
    } else if (sentimentScore < -0.3) {
      extractNegativeTriggers(body).forEach((t) => sentimentTriggers.negative.add(t));
    }

    if (!daySentiment[day]) daySentiment[day] = { sum: 0, count: 0 };
    daySentiment[day].sum += sentimentScore;
    daySentiment[day].count += 1;
  });

  // Calculate averages and prepare final data
  Object.entries(timeOfDay).forEach(([key, data]) => {
    if (data.messageCount > 0) {
      data.sentiment = data.sentiment / data.messageCount;
      data.wordCount = Math.round(data.wordCount / data.messageCount);
    }
  });

  // Process recipient data
  const recipientPatterns = Array.from(recipientMap.values()).map((recipient: RecipientData) => {
    // Calculate best time to contact (simplified)
    const hours = recipient.timestamps.map((t: number) => new Date(t).getHours());
    const hourCounts = hours.reduce((acc: Record<number, number>, h: number) => {
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const bestHourEntry = Object.entries(hourCounts).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0];
    const bestHour = (bestHourEntry?.[0] ?? '14') as string;
    
    return {
      email: recipient.email,
      name: recipient.name,
      sentiment: recipient.messageCount ? recipient.sentiment / recipient.messageCount : 0,
      responseTime: recipient.responseTimes.length > 0 
        ? Math.round(recipient.responseTimes.reduce((a: number, b: number) => a + b, 0) / recipient.responseTimes.length)
        : 0,
      topicClusters: Array.from(recipient.topics).slice(0, 5) as string[],
      bestTimeToContact: `${bestHour}:00`,
      messageCount: recipient.messageCount,
    };
  });

  // Calculate communication habits
  const fastestResponseTime = Math.min(
    ...recipientPatterns.map((r) => r.responseTime).filter((n) => !!n)
  );
  
  const mostEngagedRecipients = [...recipientPatterns]
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 3)
    .map(r => r.name);

  const sentimentByDay = Object.entries(daySentiment).reduce((acc, [day, data]) => {
    acc[day] = {
      sentiment: data.sum / data.count,
      count: data.count,
    };
    return acc;
  }, {} as Record<string, { sentiment: number; count: number }>);

  return {
    timeOfDay,
    recipientPatterns: recipientPatterns.sort((a, b) => b.messageCount - a.messageCount),
    sentimentTriggers: {
      positive: Array.from(sentimentTriggers.positive).slice(0, 10),
      negative: Array.from(sentimentTriggers.negative).slice(0, 10),
    },
    communicationHabits: {
      fastestResponseTime: `${isFinite(fastestResponseTime) ? fastestResponseTime : 0} minutes`,
      mostEngagedRecipients,
      sentimentByDay,
    },
  };
}

// Helper functions (simplified - in production, use NLP)
function extractTopics(text: string): string[] {
  // Simple keyword extraction - replace with proper NLP in production
  const keywords = [
    'meeting', 'project', 'deadline', 'review', 'budget',
    'presentation', 'report', 'team', 'client', 'update'
  ];
  
  return keywords.filter(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(text)
  );
}

function extractPositiveTriggers(text: string): string[] {
  const positivePhrases = [
    'great job', 'thank you', 'appreciate', 'excellent', 'well done',
    'impressive', 'outstanding', 'fantastic', 'wonderful', 'pleasure'
  ];
  
  return positivePhrases.filter(phrase => 
    new RegExp(`\\b${phrase}\\b`, 'i').test(text)
  );
}

function extractNegativeTriggers(text: string): string[] {
  const negativePhrases = [
    'concerned', 'issue', 'problem', 'disappointed', 'unhappy',
    'urgent', 'missed', 'late', 'error', 'mistake'
  ];
  
  return negativePhrases.filter(phrase => 
    new RegExp(`\\b${phrase}\\b`, 'i').test(text)
  );
}

// Lightweight header parsers
function extractEmail(headerValue: string): string | null {
  const match = headerValue?.match(/<([^>]+)>/);
  if (match) return match[1].toLowerCase();
  const emailMatch = headerValue?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return emailMatch ? emailMatch[1].toLowerCase() : null;
}

function extractName(headerValue: string): string | null {
  const match = headerValue?.match(/^([^<"]+)/);
  if (match) return match[1].trim().replace(/["']/g, '');
  return null;
}

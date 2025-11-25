import type { AnalyticsResponse, GmailMessage, CalendarEvent } from '@/types/analytics'
import { analyzeTextWithFallback } from '@/utils/sentiment'

// Helper to extract plain text body from Gmail payload
function getPlainTextBody(payload: any): string {
  if (!payload) return '';

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf8');
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf8');
      }
      if (part.parts) {
        const result = getPlainTextBody(part);
        if (result) return result;
      }
    }
  }
  return '';
}

export function computeAnalytics(
  params: {
    gmail: GmailMessage[]
    calendar: CalendarEvent[]
    daysBack: number
    userEmail?: string
  }
): AnalyticsResponse {
  const { gmail, calendar, daysBack, userEmail } = params

  // Aggregate helpers
  const byDay: Record<string, number> = {}
  const byHour: Record<string, number> = {}
  const senderCounts: Record<string, number> = {}

  // Sentiment counters
  let positiveCount = 0
  let neutralCount = 0
  let negativeCount = 0
  let totalSentimentScore = 0
  let sentimentAnalyzedCount = 0

  // Priority & Thread tracking
  const threads: Record<string, GmailMessage[]> = {}
  const awaitingMyReply: any[] = []
  const awaitingTheirReply: any[] = []
  const projectCounts: Record<string, number> = {}
  const projectKeywords = ['project', 'initiative', 'launch', 'sprint', 'q1', 'q2', 'q3', 'q4', 'budget', 'plan']

  let inbound = 0
  let outbound = 0

  // Process Gmail metadata
  for (const msg of gmail) {
    // Time aggregation
    const tsMs = msg.internalDate ? Number(msg.internalDate) : undefined
    if (tsMs && Number.isFinite(tsMs)) {
      const d = new Date(tsMs)
      const dayKey = d.toISOString().split('T')[0]
      const hourKey = `${String(d.getHours()).padStart(2, '0')}:00`
      byDay[dayKey] = (byDay[dayKey] || 0) + 1
      byHour[hourKey] = (byHour[hourKey] || 0) + 1
    }

    // Thread grouping
    if (msg.threadId) {
      if (!threads[msg.threadId]) threads[msg.threadId] = []
      threads[msg.threadId].push(msg)
    }

    const headers = msg.payload?.headers || []
    const fromHeader = headers.find((h) => h.name === 'From')?.value || ''
    const subject = headers.find((h) => h.name === 'Subject')?.value || ''
    const snippet = msg.snippet || ''

    // Project extraction
    const subjectLower = subject.toLowerCase()
    for (const kw of projectKeywords) {
      if (subjectLower.includes(kw)) {
        // Try to extract the project name (simple heuristic: 2-3 words around keyword)
        // For now, just track the keyword as a category
        projectCounts[kw] = (projectCounts[kw] || 0) + 1
      }
    }

    if (fromHeader) {
      // Extract email if formatted as `Name <email@domain>`
      const m = fromHeader.match(/<([^>]+)>/)
      const email = (m ? m[1] : fromHeader).trim()
      senderCounts[email] = (senderCounts[email] || 0) + 1

      // Basic inbound/outbound classification
      if (userEmail) {
        const toHeader = headers.find((h) => h.name === 'To')?.value || ''
        const fromIsUser = fromHeader.includes(userEmail)
        const toIncludesUser = toHeader.includes(userEmail)

        if (toIncludesUser && !fromIsUser) {
          inbound++

          // Sentiment Analysis on Inbound
          const body = getPlainTextBody(msg.payload)
          const textToAnalyze = `${subject} ${snippet} ${body}`.trim()
          if (textToAnalyze) {
            const { score } = analyzeTextWithFallback(textToAnalyze)
            totalSentimentScore += score
            sentimentAnalyzedCount++

            if (score > 0.1) positiveCount++
            else if (score < -0.1) negativeCount++
            else neutralCount++
          }

        } else if (fromIsUser) {
          outbound++
        }
      }
    }
  }

  // Thread Analysis for Priority Messages
  if (userEmail) {
    Object.values(threads).forEach(threadMsgs => {
      // Sort by date
      threadMsgs.sort((a, b) => Number(a.internalDate) - Number(b.internalDate))

      const lastMsg = threadMsgs[threadMsgs.length - 1]
      const headers = lastMsg.payload?.headers || []
      const fromHeader = headers.find(h => h.name === 'From')?.value || ''
      const subject = headers.find(h => h.name === 'Subject')?.value || ''
      const fromIsUser = fromHeader.includes(userEmail)

      // Check priority indicators
      const isUrgent = /urgent|asap|important|priority/i.test(subject) || /urgent|asap|important|priority/i.test(lastMsg.snippet || '')
      const isQuestion = /\?/.test(subject) || /\?/.test(lastMsg.snippet || '')

      if (!fromIsUser && (isUrgent || isQuestion)) {
        // Last message was from someone else, and it looks important/question -> Awaiting My Reply
        awaitingMyReply.push({
          id: lastMsg.id,
          sender: fromHeader.split('<')[0].trim().replace(/"/g, ''),
          subject: subject,
          channel: 'email',
          timestamp: new Date(Number(lastMsg.internalDate)).toLocaleString(),
          priority: isUrgent ? 'high' : 'medium',
          link: `https://mail.google.com/mail/u/0/#inbox/${lastMsg.threadId}`
        })
      } else if (fromIsUser && isQuestion) {
        // Last message was from me, and I asked a question -> Awaiting Their Reply
        // Find who I sent it to
        const toHeader = headers.find(h => h.name === 'To')?.value || ''
        awaitingTheirReply.push({
          id: lastMsg.id,
          sender: toHeader.split('<')[0].trim().replace(/"/g, '') || 'Recipient',
          subject: subject,
          channel: 'email',
          timestamp: new Date(Number(lastMsg.internalDate)).toLocaleString(),
          priority: 'medium',
          link: `https://mail.google.com/mail/u/0/#sent/${lastMsg.threadId}`
        })
      }
    })
  }

  // Process Calendar events
  for (const ev of calendar) {
    const startIso = ev.start?.dateTime || (ev.start?.date ? `${ev.start.date}T00:00:00Z` : undefined)
    if (startIso) {
      const d = new Date(startIso)
      const dayKey = d.toISOString().split('T')[0]
      const hourKey = `${String(d.getHours()).padStart(2, '0')}:00`
      byDay[dayKey] = (byDay[dayKey] || 0) + 1
      byHour[hourKey] = (byHour[hourKey] || 0) + 1
    }
  }

  // Build last N days series
  const today = new Date()
  const dailyCounts: number[] = []
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dailyCounts.push(byDay[key] || 0)
  }

  const topSenders = Object.entries(senderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const emailCount = gmail.length
  const calendarCount = calendar.length
  const totalCount = emailCount + calendarCount

  // Calculate Sentiment Percentages
  const totalSentiment = positiveCount + neutralCount + negativeCount
  const positivePct = totalSentiment ? Math.round((positiveCount / totalSentiment) * 100) : 0
  const negativePct = totalSentiment ? Math.round((negativeCount / totalSentiment) * 100) : 0
  const neutralPct = totalSentiment ? Math.round((neutralCount / totalSentiment) * 100) : 100

  const avgScore = sentimentAnalyzedCount ? totalSentimentScore / sentimentAnalyzedCount : 0
  const overallTrend = avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral'

  // Top Projects
  const topProjects = Object.entries(projectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), messageCount: count }))

  // Compose response including extra fields the UI can consume
  const response: AnalyticsResponse = {
    message: 'Analytics data retrieved successfully',
    total_count: totalCount,
    period_days: daysBack,
    daily_counts: dailyCounts,
    top_senders: topSenders,
    categories: {},
    dataSource: 'google',
    processing_metadata: {
      source: 'api',
      processed_at: new Date().toISOString(),
      message_count: emailCount,
      days_analyzed: daysBack,
      is_real_data: true,
    },
  }

  // Attach additional fields used by the dashboard
  return Object.assign(response, {
    inbound_count: inbound,
    outbound_count: outbound,
    avg_response_time_minutes: (() => {
      if (!userEmail) return 0;
      const replyTimes: number[] = [];

      Object.values(threads).forEach(threadMsgs => {
        threadMsgs.sort((a, b) => Number(a.internalDate) - Number(b.internalDate));

        let lastIncomingTime: number | null = null;

        threadMsgs.forEach(msg => {
          const headers = msg.payload?.headers || [];
          const fromHeader = headers.find(h => h.name === 'From')?.value || '';
          const fromIsUser = fromHeader.includes(userEmail);
          const msgTime = Number(msg.internalDate);

          if (!fromIsUser) {
            lastIncomingTime = msgTime;
          } else if (lastIncomingTime !== null) {
            // User replied to an incoming message
            const diffMinutes = (msgTime - lastIncomingTime) / (1000 * 60);
            // Filter out unreasonable times (e.g. > 30 days) or negative
            if (diffMinutes > 0 && diffMinutes < 43200) {
              replyTimes.push(diffMinutes);
            }
            lastIncomingTime = null; // Reset
          }
        });
      });

      if (replyTimes.length === 0) return 0;
      const sum = replyTimes.reduce((a, b) => a + b, 0);
      return Math.round(sum / replyTimes.length);
    })(),
    channel_analytics: {
      by_channel: [
        { name: 'Email', count: emailCount, percentage: totalCount ? Math.round((emailCount / totalCount) * 100) : 0 },
        { name: 'Calendar', count: calendarCount, percentage: totalCount ? Math.round((calendarCount / totalCount) * 100) : 0 },
      ].filter((x) => x.count > 0),
      by_time: Object.entries(byHour)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour)),
    },
    message_distribution: {
      by_day: Object.entries(byDay).map(([date, count]) => ({ date, count })),
      by_sender: topSenders,
    },
    top_projects: topProjects,
    priority_messages: {
      awaiting_my_reply: awaitingMyReply.slice(0, 5),
      awaiting_their_reply: awaitingTheirReply.slice(0, 5),
    },
    sentiment_analysis: {
      positive: positivePct,
      neutral: neutralPct,
      negative: negativePct,
      overall_trend: overallTrend,
    },
  }) as AnalyticsResponse
}

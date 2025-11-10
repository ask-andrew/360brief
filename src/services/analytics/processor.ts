import type { AnalyticsResponse, GmailMessage, CalendarEvent } from '@/types/analytics'

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

  let inbound = 0
  let outbound = 0

  // Process Gmail metadata
  for (const msg of gmail) {
    const tsMs = msg.internalDate ? Number(msg.internalDate) : undefined
    if (tsMs && Number.isFinite(tsMs)) {
      const d = new Date(tsMs)
      const dayKey = d.toISOString().split('T')[0]
      const hourKey = `${String(d.getHours()).padStart(2, '0')}:00`
      byDay[dayKey] = (byDay[dayKey] || 0) + 1
      byHour[hourKey] = (byHour[hourKey] || 0) + 1
    }
    const headers = msg.payload?.headers || []
    const fromHeader = headers.find((h) => h.name === 'From')?.value
    if (fromHeader) {
      // Extract email if formatted as `Name <email@domain>`
      const m = fromHeader.match(/<([^>]+)>/)
      const email = (m ? m[1] : fromHeader).trim()
      senderCounts[email] = (senderCounts[email] || 0) + 1
      // Basic inbound/outbound classification if userEmail is available
      if (userEmail) {
        const toHeader = headers.find((h) => h.name === 'To')?.value || ''
        const fromIsUser = fromHeader.includes(userEmail)
        const toIncludesUser = toHeader.includes(userEmail)
        if (toIncludesUser && !fromIsUser) inbound++
        else if (fromIsUser) outbound++
      }
    }
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
    avg_response_time_minutes: 0,
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
    top_projects: [],
    priority_messages: {
      awaiting_my_reply: [],
      awaiting_their_reply: [],
    },
    sentiment_analysis: {
      positive: 0,
      neutral: 100,
      negative: 0,
      overall_trend: 'neutral' as const,
    },
  }) as AnalyticsResponse
}

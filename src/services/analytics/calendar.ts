import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import type { CalendarEvent } from '@/types/analytics'
import { withRetry } from '@/services/analytics/retry'

const MAX_PAGES = 5 // Maximum number of pages to fetch (5 pages * 250 events = 1250 max events)
const PAGE_SIZE = 250 // Maximum allowed by Google Calendar API

export interface FetchCalendarEventsOptions {
  /** Number of days to look back for events */
  daysBack: number
  /** Maximum number of events to return (capped at 1250) */
  maxResults?: number
  /** Timezone for date calculations */
  timeZone?: string
}

export async function fetchCalendarEvents(
  oauth: OAuth2Client,
  options: FetchCalendarEventsOptions
): Promise<CalendarEvent[]> {
  const { daysBack, timeZone = 'UTC', maxResults = 1000 } = options
  const calendar = google.calendar({ version: 'v3', auth: oauth })
  const allEvents: CalendarEvent[] = []
  let pageToken: string | undefined
  let pageCount = 0

  const now = new Date()
  const timeMin = new Date()
  timeMin.setDate(timeMin.getDate() - daysBack)

  try {
    do {
      const res = await withRetry(async () =>
        calendar.events.list({
          calendarId: 'primary',
          timeMin: timeMin.toISOString(),
          timeMax: now.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: Math.min(PAGE_SIZE, maxResults - allEvents.length),
          pageToken,
          timeZone,
        })
      )

      const items = res.data.items || []
      const pageEvents = items.map((event) => {
        const mappedEvent: CalendarEvent = {
          id: event.id || '',
          summary: event.summary ?? undefined,
          start: { 
            dateTime: event.start?.dateTime ?? undefined, 
            date: event.start?.date ?? undefined 
          },
          end: { 
            dateTime: event.end?.dateTime ?? undefined, 
            date: event.end?.date ?? undefined 
          },
          attendees: (event.attendees || []).map((a) => ({
            email: a.email ?? undefined,
            displayName: a.displayName ?? undefined,
            responseStatus: a.responseStatus ?? undefined,
            self: a.self ?? false
          })),
          organizer: event.organizer ? { 
            email: event.organizer.email ?? undefined,
            displayName: event.organizer.displayName ?? undefined,
            self: event.organizer.self ?? false
          } : undefined,
          platform: 'Google Calendar',
          isOrganizer: event.organizer?.self ?? false,
          status: event.status,
          htmlLink: event.htmlLink ?? undefined,
          created: event.created ?? undefined,
          updated: event.updated ?? undefined,
        };
        return mappedEvent;
      })

      allEvents.push(...pageEvents)
      pageToken = res.data.nextPageToken ?? undefined
      pageCount++

      // Stop if we've reached the desired number of events or max pages
      if (allEvents.length >= maxResults || pageCount >= MAX_PAGES || !pageToken) {
        break
      }
    } while (pageToken && pageCount < MAX_PAGES)

    return allEvents.slice(0, maxResults) // Ensure we don't exceed maxResults
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    // Return whatever events we've successfully fetched so far
    return allEvents
  }
}

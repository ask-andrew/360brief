import { google } from 'googleapis';
import { getValidAccessToken } from './oauth';

// Types for Google Calendar API responses
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    self?: boolean;
  }>;
  organizer: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
    conferenceSolution?: {
      name: string;
      iconUri: string;
    };
  };
  hangoutLink?: string;
  htmlLink?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  recurringEventId?: string;
  originalStartTime?: {
    dateTime: string;
    timeZone?: string;
  };
}

/**
 * Fetches upcoming calendar events
 * @param userId User ID
 * @param maxResults Maximum number of results to return (default: 10)
 * @param timeMin Start of the time range (ISO string)
 * @param timeMax End of the time range (ISO string)
 * @returns Array of calendar events
 */
export async function fetchUpcomingEvents(
  userId: string,
  maxResults = 10,
  timeMin?: string,
  timeMax?: string
): Promise<CalendarEvent[]> {
  try {
    const accessToken = await getValidAccessToken(userId);
    
    const calendar = google.calendar({
      version: 'v3',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const now = new Date();
    const defaultTimeMin = now.toISOString();
    
    // Set timeMax to end of day by default
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const defaultTimeMax = endOfDay.toISOString();

    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || defaultTimeMin,
      timeMax: timeMax || defaultTimeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: false,
    });

    return (data.items || []) as CalendarEvent[];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error('Failed to fetch calendar events');
  }
}

/**
 * Fetches calendar events for a specific date range
 * @param userId User ID
 * @param startDate Start date (Date object)
 * @param endDate End date (Date object)
 * @returns Array of calendar events
 */
export async function fetchEventsForDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  try {
    const accessToken = await getValidAccessToken(userId);
    
    const calendar = google.calendar({
      version: 'v3',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: false,
    });

    return (data.items || []) as CalendarEvent[];
  } catch (error) {
    console.error('Error fetching calendar events for date range:', error);
    throw new Error('Failed to fetch calendar events for date range');
  }
}

/**
 * Creates a new calendar event
 * @param userId User ID
 * @param event Event details
 * @returns Created event
 */
export async function createEvent(
  userId: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
    reminders?: {
      useDefault: boolean;
      overrides?: Array<{ method: string; minutes: number }>;
    };
  }
): Promise<CalendarEvent> {
  try {
    const accessToken = await getValidAccessToken(userId);
    
    const calendar = google.calendar({
      version: 'v3',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });

    return data as CalendarEvent;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Updates an existing calendar event
 * @param userId User ID
 * @param eventId Event ID
 * @param updates Event updates
 * @returns Updated event
 */
export async function updateEvent(
  userId: string,
  eventId: string,
  updates: Partial<{
    summary: string;
    description: string;
    location: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees: Array<{ email: string }>;
    reminders: {
      useDefault: boolean;
      overrides: Array<{ method: string; minutes: number }>;
    };
  }>
): Promise<CalendarEvent> {
  try {
    const accessToken = await getValidAccessToken(userId);
    
    const calendar = google.calendar({
      version: 'v3',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // First, get the existing event
    const { data: existingEvent } = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    // Merge updates with existing event
    const updatedEvent = {
      ...existingEvent,
      ...updates,
      id: eventId,
    };

    const { data } = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: updatedEvent,
      sendUpdates: 'all',
    });

    return data as CalendarEvent;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error('Failed to update calendar event');
  }
}

/**
 * Deletes a calendar event
 * @param userId User ID
 * @param eventId Event ID
 */
export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  try {
    const accessToken = await getValidAccessToken(userId);
    
    const calendar = google.calendar({
      version: 'v3',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error('Failed to delete calendar event');
  }
}

/**
 * Gets the user's calendar list
 * @param userId User ID
 * @returns Array of calendars
 */
export async function getCalendarList(userId: string) {
  try {
    const accessToken = await getValidAccessToken(userId);
    
    const calendar = google.calendar({
      version: 'v3',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { data } = await calendar.calendarList.list();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching calendar list:', error);
    throw new Error('Failed to fetch calendar list');
  }
}

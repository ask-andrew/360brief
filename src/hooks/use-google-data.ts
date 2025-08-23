'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { GoogleAPIService, CalendarEvent, Email } from '@/services/google-api';

export interface GoogleData {
  events: CalendarEvent[];
  emails: Email[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useGoogleData(session: Session | null): GoogleData {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.provider_token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await GoogleAPIService.getUpcomingEventsAndEmails(session);
      setEvents(data.events);
      setEmails(data.emails);
    } catch (err) {
      console.error('Error fetching Google data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch Google data'));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.provider_token) {
      fetchData();
    }
  }, [session, fetchData]);

  return {
    events,
    emails,
    loading,
    error,
    refresh: fetchData,
  };
}

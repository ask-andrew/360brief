import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Client-side calendar event type
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    self?: boolean;
  }>;
  conferenceData?: {
    conferenceSolution?: {
      name: string;
    };
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
    }>;
  };
  htmlLink?: string;
  hangoutLink?: string;
}

type UseEventsOptions = {
  enabled?: boolean;
  maxResults?: number;
  timeMin?: string;
  timeMax?: string;
  refetchInterval?: number | false;
};

/**
 * Hook to fetch upcoming calendar events (mock implementation)
 */
export function useUpcomingEvents({
  enabled = true,
  maxResults = 5,
  timeMin,
  timeMax,
  refetchInterval = 5 * 60 * 1000, // 5 minutes
}: UseEventsOptions = {}) {
  const { user } = useAuth();

  return useQuery<CalendarEvent[], Error>({
    queryKey: ['calendar', 'upcoming'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // Mock data for now - replace with API call to /api/calendar/events
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return [
        {
          id: '1',
          summary: 'Team Standup',
          description: 'Daily team synchronization meeting',
          start: {
            dateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
            timeZone: 'America/New_York'
          },
          end: {
            dateTime: new Date(now.getTime() + 2.5 * 60 * 60 * 1000).toISOString(),
            timeZone: 'America/New_York'
          },
          location: 'Conference Room A',
          attendees: [
            { email: 'team@company.com', displayName: 'Team', responseStatus: 'accepted' }
          ]
        },
        {
          id: '2',
          summary: 'Product Review',
          description: 'Weekly product review with stakeholders',
          start: {
            dateTime: tomorrow.toISOString(),
            timeZone: 'America/New_York'
          },
          end: {
            dateTime: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: 'America/New_York'
          },
          conferenceData: {
            conferenceSolution: { name: 'Google Meet' },
            entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/abc-xyz' }]
          }
        }
      ];
    },
    enabled: enabled && !!user,
    refetchInterval,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch events for a specific date range
 */
export function useEventsForDateRange(
  startDate: Date,
  endDate: Date,
  options: Omit<UseEventsOptions, 'timeMin' | 'timeMax'> = {}
) {
  const { user } = useAuth();
  const { enabled = true, refetchInterval = 5 * 60 * 1000 } = options;

  return useQuery<CalendarEvent[], Error>({
    queryKey: ['calendar', 'date-range', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [];
    },
    enabled: enabled && !!user,
    refetchInterval,
    refetchOnWindowFocus: true,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new calendar event
 */
export function useCreateEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<CalendarEvent, Error, any>({
    mutationFn: async (event) => {
      if (!user) throw new Error('User not authenticated');
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...event, id: Date.now().toString() } as CalendarEvent;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

/**
 * Hook to update an existing calendar event
 */
export function useUpdateEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    CalendarEvent,
    Error,
    { eventId: string; updates: any }
  >({
    mutationFn: async ({ eventId, updates }) => {
      if (!user) throw new Error('User not authenticated');
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...updates, id: eventId } as CalendarEvent;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

/**
 * Hook to delete a calendar event
 */
export function useDeleteEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (eventId) => {
      if (!user) throw new Error('User not authenticated');
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

/**
 * Hook to get the user's calendar list
 */
export function useCalendarList() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['calendar', 'list'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        { id: 'primary', summary: 'Primary Calendar' },
        { id: 'work', summary: 'Work Calendar' }
      ];
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Hook to get calendar statistics
 */
export function useCalendarStats() {
  const { data: upcomingEvents, isLoading } = useUpcomingEvents({ maxResults: 100 });
  
  // Process events to get statistics
  const stats = {
    totalUpcoming: upcomingEvents?.length || 0,
    today: upcomingEvents?.filter(event => {
      const eventDate = new Date(event.start.dateTime);
      const today = new Date();
      return (
        eventDate.getDate() === today.getDate() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear()
      );
    }).length || 1, // Mock: show 1 meeting today
    byType: upcomingEvents?.reduce((acc, event) => {
      // Simple heuristic to determine event type
      const type = event.location?.includes('zoom.us') || event.conferenceData ? 'Meeting' : 'Event';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || { 'Meeting': 2 },
    busyHours: upcomingEvents?.reduce((acc, event) => {
      const hour = new Date(event.start.dateTime).getHours();
      acc[`${hour}:00`] = (acc[`${hour}:00`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || { '9:00': 1, '14:00': 1 },
  };

  return {
    stats,
    isLoading,
  };
}

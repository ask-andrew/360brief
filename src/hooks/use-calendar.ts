import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchUpcomingEvents, 
  fetchEventsForDateRange, 
  createEvent as createCalendarEvent,
  updateEvent as updateCalendarEvent,
  deleteEvent as deleteCalendarEvent,
  getCalendarList,
  CalendarEvent
} from '@/lib/calendar/client';
import { useAuthStore } from '@/store/auth-store';

type UseEventsOptions = {
  enabled?: boolean;
  maxResults?: number;
  timeMin?: string;
  timeMax?: string;
  refetchInterval?: number | false;
};

/**
 * Hook to fetch upcoming calendar events
 */
export function useUpcomingEvents({
  enabled = true,
  maxResults = 5,
  timeMin,
  timeMax,
  refetchInterval = 5 * 60 * 1000, // 5 minutes
}: UseEventsOptions = {}) {
  const user = useAuthStore(state => state.user);
  const userId = user?.id;

  return useQuery<CalendarEvent[], Error>({
    queryKey: ['calendar', 'upcoming'],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return fetchUpcomingEvents(userId, maxResults, timeMin, timeMax);
    },
    enabled: enabled && !!userId,
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
  const user = useAuthStore(state => state.user);
  const userId = user?.id;
  const { enabled = true, refetchInterval = 5 * 60 * 1000 } = options;

  return useQuery<CalendarEvent[], Error>({
    queryKey: ['calendar', 'date-range', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return fetchEventsForDateRange(userId, startDate, endDate);
    },
    enabled: enabled && !!userId,
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
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation<CalendarEvent, Error, Parameters<typeof createCalendarEvent>[1]>({
    mutationFn: async (event) => {
      if (!userId) throw new Error('User not authenticated');
      return createCalendarEvent(userId, event);
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
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation<
    CalendarEvent,
    Error,
    { eventId: string; updates: Parameters<typeof updateCalendarEvent>[2] }
  >({
    mutationFn: async ({ eventId, updates }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateCalendarEvent(userId, eventId, updates);
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
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation<void, Error, string>({
    mutationFn: async (eventId) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteCalendarEvent(userId, eventId);
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
  const user = useAuthStore(state => state.user);
  const userId = user?.id;

  return useQuery({
    queryKey: ['calendar', 'list'],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return getCalendarList(userId);
    },
    enabled: !!userId,
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
    }).length || 0,
    byType: upcomingEvents?.reduce((acc, event) => {
      // Simple heuristic to determine event type
      const type = event.location?.includes('zoom.us') || event.conferenceData ? 'Meeting' : 'Event';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    busyHours: upcomingEvents?.reduce((acc, event) => {
      const hour = new Date(event.start.dateTime).getHours();
      acc[`${hour}:00`] = (acc[`${hour}:00`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
  };

  return {
    stats,
    isLoading,
  };
}

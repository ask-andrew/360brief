'use client';

import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { useUpcomingEvents, useDeleteEvent } from '@/hooks/use-calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface EventListProps {
  maxItems?: number;
  className?: string;
  showActions?: boolean;
}

export function EventList({ 
  maxItems = 5, 
  className = '',
  showActions = true 
}: EventListProps) {
  const { data: events, isLoading, error, refetch } = useUpcomingEvents({ 
    maxResults: maxItems 
  });
  const { mutate: deleteEvent } = useDeleteEvent();

  const handleDelete = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <EventSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center">
          <Icons.alertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-600">Failed to load calendar events. Please try again.</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => refetch()}
          >
            <Icons.refreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center">
          <Icons.calendar className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No upcoming events</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={handleRefresh}
          >
            <Icons.refreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatEventTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return format(date, 'h:mm a');
  };

  const formatEventDate = (dateTime: string) => {
    const date = new Date(dateTime);
    
    if (isToday(date)) {
      return 'Today';
    }
    
    if (isTomorrow(date)) {
      return 'Tomorrow';
    }
    
    return format(date, 'EEEE, MMM d');
  };

  const getRelativeTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = formatEventDate(event.start.dateTime);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Upcoming Events</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          title="Refresh"
        >
          <Icons.refreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(eventsByDate).map(([date, dateEvents]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>
              <div className="space-y-3">
                {dateEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium">{event.summary}</h4>
                          <div className="text-sm text-muted-foreground">
                            {formatEventTime(event.start.dateTime)}
                            {event.end && ` • ${formatEventTime(event.end.dateTime)}`}
                            {event.location && ` • ${event.location}`}
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {showActions && (
                        <div className="flex items-center space-x-1">
                          {event.htmlLink && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => window.open(event.htmlLink, '_blank')}
                              title="Open in Google Calendar"
                            >
                              <Icons.externalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(event.id)}
                            title="Delete event"
                          >
                            <Icons.trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="mt-3 pt-3 border-t text-sm">
                        <div className="text-xs text-muted-foreground mb-1">Attendees:</div>
                        <div className="flex flex-wrap gap-2">
                          {event.attendees.map((attendee) => (
                            <div 
                              key={attendee.email}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                            >
                              {attendee.displayName || attendee.email}
                              {attendee.self && ' (You)'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {event.conferenceData?.entryPoints?.some(ep => ep.entryPointType === 'video') && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const videoLink = event.conferenceData?.entryPoints?.find(
                              ep => ep.entryPointType === 'video'
                            )?.uri || event.hangoutLink;
                            if (videoLink) {
                              window.open(videoLink, '_blank');
                            }
                          }}
                        >
                          <Icons.video className="mr-2 h-4 w-4" />
                          Join Meeting
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EventSkeleton() {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Skeleton className="h-2 w-2 rounded-full mt-1.5" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

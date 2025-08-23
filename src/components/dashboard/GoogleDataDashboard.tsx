'use client';

import { Session } from '@supabase/supabase-js';
import { useGoogleData } from '@/hooks/useGoogleData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface GoogleDataDashboardProps {
  session: Session | null;
}

export function GoogleDataDashboard({ session }: GoogleDataDashboardProps) {
  const { data, loading, error } = useGoogleData(session);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-destructive">
            <p>Error loading data: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>No data available. Please sign in with Google to view your data.</p>
        </CardContent>
      </Card>
    );
  }

  const { events, emails, user } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name || user?.email?.split('@')[0]}</h1>
        <p className="text-muted-foreground">Here's what's happening today</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                    </p>
                    {event.location && (
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    )}
                    {event.attendees && event.attendees.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        With: {event.attendees.map(a => a.email.split('@')[0]).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming events</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Emails</CardTitle>
          </CardHeader>
          <CardContent>
            {emails.length > 0 ? (
              <div className="space-y-4">
                {emails.map((email) => (
                  <div key={email.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{email.from}</h3>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(email.date), 'MMM d')}
                      </span>
                    </div>
                    <p className="font-medium">{email.subject}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {email.snippet}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent emails</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

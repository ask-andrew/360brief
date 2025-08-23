'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Mail, Clock, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CalendarEvent, Email } from '@/services/google-api';

interface GoogleDataViewProps {
  events: CalendarEvent[];
  emails: Email[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => Promise<void>;
}

function formatDateTime(dateTimeString: string) {
  return format(new Date(dateTimeString), 'MMM d, yyyy h:mm a');
}

function getHeaderValue(headers: Array<{ name: string; value: string }>, name: string) {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

export function GoogleDataView({ events, emails, loading, error, onRefresh }: GoogleDataViewProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Data</h2>
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={loading || refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading data
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Data</h2>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={loading || refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Upcoming Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <h3 className="font-medium">{event.summary}</h3>
                    <div className="mt-1 flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-3.5 w-3.5" />
                      <span>
                        {formatDateTime(event.start.dateTime)} - {formatDateTime(event.end.dateTime)}
                      </span>
                    </div>
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="mt-1 flex items-center text-sm text-muted-foreground">
                        <User className="mr-1 h-3.5 w-3.5" />
                        <span>
                          {event.attendees
                            .filter(a => !a.self)
                            .map(a => a.email)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Recent Emails</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : emails.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent emails</p>
            ) : (
              <div className="space-y-4">
                {emails.map((email) => {
                  const from = getHeaderValue(email.payload.headers, 'From');
                  const subject = getHeaderValue(email.payload.headers, 'Subject');
                  
                  return (
                    <div key={email.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <h3 className="font-medium">{subject || '(No subject)'}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        From: {from}
                      </p>
                      <p className="mt-1 text-sm line-clamp-2">
                        {email.snippet}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

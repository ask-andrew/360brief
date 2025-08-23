import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleAPIService } from '@/services/google-api';
import { Database } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options);
            } catch (error) {
              console.error('Error setting cookie:', error);
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set(name, '', { ...options, maxAge: 0 });
            } catch (error) {
              console.error('Error removing cookie:', error);
            }
          },
        },
      }
    );
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      return NextResponse.json(
        { error: 'Not authenticated with Google' },
        { status: 401 }
      );
    }

    // Fetch data from Google APIs in parallel
    const [events, emails] = await Promise.all([
      GoogleAPIService.getCalendarEvents(session.provider_token),
      GoogleAPIService.getEmails(session.provider_token)
    ]);

    // Process events to extract relevant data
    const processedEvents = events.map(event => ({
      id: event.id,
      title: event.summary || 'No title',
      start: event.start.dateTime,
      end: event.end.dateTime,
      description: event.description || '',
      location: event.location || '',
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email,
        status: attendee.responseStatus,
        isOrganizer: attendee.self
      })) || [],
      htmlLink: (event as any).htmlLink || ''
    }));

    // Process emails to extract relevant data
    const processedEmails = emails.map(email => {
      const headers = email.payload.headers || [];
      const getHeader = (name: string) => 
        headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
        
      return {
        id: email.id,
        threadId: email.threadId,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        snippet: email.snippet,
        internalDate: email.internalDate,
        labels: email.labelIds || []
      };
    });

    return NextResponse.json({
      events: processedEvents,
      emails: processedEmails,
      user: {
        email: session.user.email,
        name: session.user.user_metadata?.full_name
      }
    });

  } catch (error) {
    console.error('Error fetching Google data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

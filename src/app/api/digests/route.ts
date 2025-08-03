import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { fetchUpcomingEvents } from '@/lib/calendar/client';
import { fetchUnreadEmails } from '@/lib/gmail/client';
import { sendWeeklyDigest } from '@/lib/email/sendDigest';
import { generateWeeklyDigest } from '@/lib/digest/generator';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get all users who should receive a digest
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, timezone, digest_preferences')
      .eq('email_notifications', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users to process' }, { status: 200 });
    }

    const results = [];
    const now = new Date();
    const dateRange = getDateRange(now);

    // Process each user's digest
    for (const user of users) {
      try {
        // Get user's access tokens
        const { data: tokens, error: tokensError } = await supabase
          .from('user_tokens')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (tokensError || !tokens) {
          console.error(`No tokens found for user ${user.id}`);
          continue;
        }

        // Fetch user's upcoming events
        const events = await fetchUpcomingEvents(tokens.access_token);
        
        // Fetch user's unread emails
        const emails = await fetchUnreadEmails(tokens.access_token);

        // Generate digest content
        const digestContent = await generateWeeklyDigest(emails, events, user.id);

        // Save digest to database
        const { data: digest, error: digestError } = await supabase
          .from('digests')
          .insert([
            {
              user_id: user.id,
              content: digestContent,
              date_range: dateRange,
              email_sent: false,
            },
          ])
          .select()
          .single();

        if (digestError || !digest) {
          console.error('Error saving digest:', digestError);
          throw digestError || new Error('Failed to save digest');
        }

        // Send email with digest
        await sendWeeklyDigest({
          to: user.email,
          userName: user.full_name || undefined,
          dateRange,
          emails,
          events,
        });

        // Update digest as sent
        await supabase
          .from('digests')
          .update({ email_sent: true, sent_at: new Date().toISOString() })
          .eq('id', digest.id);

        results.push({
          userId: user.id,
          status: 'success',
          digestId: digest.id,
        });
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        results.push({
          userId: user.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: 'Digest generation completed',
      results,
    });
  } catch (error) {
    console.error('Error in digest generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate digests' },
      { status: 500 }
    );
  }
}

// Helper function to get the current week's date range
function getDateRange(date: Date): string {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // End of week (Saturday)
  
  const formatOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
  };
  
  return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`;
}

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { format } from 'date-fns';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY!);

// Main handler for the Netlify Function
export const handler: Handler = async (event, context) => {
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' }),
      };
    }

    // Get all users who should receive a digest now
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // Get users whose digest time matches the current time
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, timezone')
      .eq('digest_time', currentTime);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No users to process at this time' }),
      };
    }

    // Process each user's digest
    const results = await Promise.allSettled(
      users.map(async (user) => {
        try {
          // Generate the digest content
          const digestContent = await generateDigestContent(user.id);
          
          // Send the digest email
          await sendDigestEmail(user, digestContent);
          
          // Save the digest to the database
          await saveDigest(user.id, digestContent);
          
          return { userId: user.id, status: 'success' };
        } catch (error) {
          console.error(`Error processing digest for user ${user.id}:`, error);
          return { userId: user.id, status: 'error', error: error.message };
        }
      })
    );

    // Count successful and failed digests
    const successfulDigests = results.filter(
      (result) => result.status === 'fulfilled' && result.value.status === 'success'
    ).length;
    
    const failedDigests = results.length - successfulDigests;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Digest generation completed',
        totalUsers: users.length,
        successfulDigests,
        failedDigests,
      }),
    };
  } catch (error) {
    console.error('Error in generate-digest function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error.message,
      }),
    };
  }
};

// Helper function to generate digest content
async function generateDigestContent(userId: string) {
  // Get user's calendar events for the past week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const { data: events, error: eventsError } = await supabase
    .from('user_events') // This would be a view or table with user's calendar events
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', oneWeekAgo.toISOString())
    .order('start_time', { ascending: true });

  if (eventsError) {
    console.error('Error fetching events:', eventsError);
    throw eventsError;
  }

  // Get user's unread emails (this would integrate with Gmail API)
  const emails = []; // Placeholder for email data
  
  // Format the digest content
  return {
    events: events || [],
    emails: emails || [],
    generatedAt: new Date().toISOString(),
  };
}

// Helper function to send digest email
async function sendDigestEmail(user: any, content: any) {
  const { email, full_name } = user;
  const userName = full_name || 'there';
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Weekly Digest</title>
      </head>
      <body>
        <h1>Hi ${userName},</h1>
        <p>Here's your weekly digest for ${format(new Date(), 'MMMM d, yyyy')}:</p>
        
        <h2>📅 Upcoming Events</h2>
        ${content.events.length > 0 
          ? `<ul>${content.events.map((event: any) => 
              `<li>${event.title} - ${format(new Date(event.start_time), 'MMM d, h:mm a')}</li>`
            ).join('')}</ul>`
          : '<p>No upcoming events.</p>'
        }
        
        <h2>📧 Recent Emails</h2>
        ${content.emails.length > 0 
          ? `<ul>${content.emails.map((email: any) => 
              `<li>${email.sender}: ${email.subject}</li>`
            ).join('')}</ul>`
          : '<p>No new emails to show.</p>'
        }
        
        <p>Have a great day!<br>The 360Brief Team</p>
      </body>
    </html>
  `;

  const { data, error } = await resend.emails.send({
    from: 'digest@360brief.com', // Update with your verified sender
    to: email,
    subject: `Your Weekly Digest - ${format(new Date(), 'MMMM d, yyyy')}`,
    html: emailHtml,
  });

  if (error) {
    console.error('Error sending email:', error);
    throw error;
  }

  return data;
}

// Helper function to save digest to database
async function saveDigest(userId: string, content: any) {
  const { data, error } = await supabase
    .from('digests')
    .insert([
      {
        user_id: userId,
        content,
        sent_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) {
    console.error('Error saving digest:', error);
    throw error;
  }

  return data;
}

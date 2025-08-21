// Netlify types are optional; using any to avoid type dependency
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { format } from 'date-fns';
// Import generator via relative path to avoid TS path alias issues
import { generateExecutiveBrief } from '../../src/lib/brief/briefGenerator';

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
export const handler = async (event: any, context: any) => {
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
          // Look up user preference for brief style
          const style = await getUserPreferredStyle(user.id);
          // Generate the brief content using preferred style
          const digestContent = await generateDigestContent(user.id, style);
          
          // Send the digest email
          await sendDigestEmail(user, digestContent);
          
          // Save the digest to the database
          await saveDigest(user.id, digestContent);
          
          return { userId: user.id, status: 'success' };
        } catch (error) {
          console.error(`Error processing digest for user ${user.id}:`, error);
          const message = error instanceof Error ? error.message : 'Unknown error';
          return { userId: user.id, status: 'error', error: message };
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
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Helper: fetch unified data from external Unified API
async function fetchUnifiedDataForUser(userId: string) {
  const base = process.env.UNIFIED_API_BASE || process.env.NEXT_PUBLIC_UNIFIED_API_BASE || 'http://localhost:8001';
  const url = `${base.replace(/\/$/, '')}/api/unified`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Unified API error: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.warn('Unified API not available, falling back to empty unified data');
    return { emails: [], incidents: [], calendarEvents: [], tickets: [], generated_at: new Date().toISOString() };
  }
}

// Helper function to generate Executive Brief content
async function generateDigestContent(userId: string, style?: string) {
  const unified = await fetchUnifiedDataForUser(userId);
  // Default style can later be user preference-driven
  const brief = await generateExecutiveBrief(unified, { userId, style: mapStyle(style) });
  return brief;
}

// Map free-form preference to supported styles
function mapStyle(input?: string): 'mission_brief' | 'management_consulting' | 'startup_velocity' | 'newsletter' {
  switch ((input || '').toLowerCase()) {
    case 'mission_brief':
    case 'mission':
    case 'bluf':
      return 'mission_brief';
    case 'management_consulting':
    case 'consulting':
    case 'mckinsey':
      return 'management_consulting';
    case 'startup_velocity':
    case 'startup':
    case 'velocity':
      return 'startup_velocity';
    case 'newsletter':
    case 'newspaper':
    case 'editorial':
      return 'newsletter';
    default:
      return 'mission_brief';
  }
}

// Read user preference from user_preferences table
async function getUserPreferredStyle(userId: string): Promise<string | undefined> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('digest_style')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.warn('Preference lookup failed for user', userId, error);
      return undefined;
    }
    return data?.digest_style as string | undefined;
  } catch (e) {
    console.warn('Preference lookup exception for user', userId, e);
    return undefined;
  }
}

// Helper function to send digest email from ExecutiveBrief
async function sendDigestEmail(user: any, brief: any) {
  const { email, full_name } = user;
  const userName = full_name || 'there';
  const subject = brief?.subject || `Your Brief - ${format(new Date(), 'MMMM d, yyyy')}`;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Brief</title>
      </head>
      <body>
        <h1>Hi ${userName},</h1>
        <p><strong>TL;DR:</strong> ${brief.tldr || 'Your executive brief is ready.'}</p>

        ${brief.metrics ? `
          <h2>📊 Metrics</h2>
          <ul>
            ${typeof brief.metrics.emails === 'number' ? `<li>Emails: ${brief.metrics.emails}</li>` : ''}
            ${typeof brief.metrics.meetings === 'number' ? `<li>Meetings: ${brief.metrics.meetings}</li>` : ''}
            ${brief.metrics.trendLabel ? `<li>Trend: ${brief.metrics.trendLabel}</li>` : ''}
          </ul>
        ` : ''}

        ${Array.isArray(brief.highlights) && brief.highlights.length ? `
          <h2>⭐ Highlights</h2>
          <ul>
            ${brief.highlights.map((h: any) => `<li><strong>${h.title}:</strong> ${h.summary}</li>`).join('')}
          </ul>
        ` : ''}

        ${Array.isArray(brief.nextSteps) && brief.nextSteps.length ? `
          <h2>➡️ Next Steps</h2>
          <ul>
            ${brief.nextSteps.map((n: any) => `<li>${n.title}${n.assignee ? ` — ${n.assignee}` : ''}${n.due ? ` (due ${n.due})` : ''}</li>`).join('')}
          </ul>
        ` : ''}

        <p>— The 360Brief Team</p>
      </body>
    </html>
  `;

  const { data, error } = await resend.emails.send({
    from: 'digest@360brief.com', // Update with your verified sender
    to: email,
    subject,
    html: emailHtml,
  });

  if (error) {
    console.error('Error sending email:', error);
    throw error;
  }

  return data;
}

// Helper function to save brief to database
async function saveDigest(userId: string, brief: any) {
  const { data, error } = await supabase
    .from('digests')
    .insert([
      {
        user_id: userId,
        content: brief,
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

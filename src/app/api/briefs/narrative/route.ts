// src/app/api/briefs/narrative/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const PRIMARY_URL = process.env.BRIEF_GENERATOR_URL || 'http://localhost:8000/generate-narrative-brief'
const FALLBACK_URL = 'http://localhost:8010/generate-narrative-brief'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function fetchRealEmails(userId: string, daysBack: number, filterMarketing: boolean): Promise<any[]> {
  // Fetch real emails from Gmail for the authenticated user
  console.log(`🔄 Fetching real Gmail data for narrative brief, user: ${userId}`);

  // Get Gmail access token from user_tokens table
  const { data: tokens, error: tokenError } = await supabase
    .from('user_tokens')
    .select('access_token, refresh_token, expires_at, user_id, provider')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .limit(1);

  if (tokenError || !tokens || tokens.length === 0) {
    console.error('❌ No tokens found for user:', userId);
    return [];
  }

  const token = tokens[0];
  const now = Math.floor(Date.now() / 1000);

  // Check if token needs refresh
  if (token.expires_at && token.expires_at < now) {
    console.log('🔄 Token expired, attempting refresh...');

    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: token.access_token,
        refresh_token: token.refresh_token,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update token in database
      await supabase
        .from('user_tokens')
        .update({
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
        })
        .eq('user_id', userId)
        .eq('provider', 'google');

      token.access_token = credentials.access_token;
      console.log('✅ Successfully refreshed access token');

    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);
      return [];
    }
  }

  // Set up Gmail API
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token.access_token });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysBack);

  // Build search query
  let query = `after:${Math.floor(startDate.getTime() / 1000)}`;
  if (filterMarketing) {
    query += ' -category:promotions -category:social';
  }

  console.log(`📧 Gmail search query: ${query}`);

  // Get message list
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 50,
  });

  if (!listResponse.data.messages) {
    return [];
  }

  console.log(`📊 Found ${listResponse.data.messages.length} message IDs`);

  // Get full message details
  const messages: any[] = [];
  const batchSize = 10; // Process in smaller batches to avoid timeouts

  for (let i = 0; i < listResponse.data.messages.length; i += batchSize) {
    const batch = listResponse.data.messages.slice(i, i + batchSize);

    const batchPromises = batch.map(async (msg) => {
      try {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full',
        });

        const message = fullMessage.data;
        const headers = message.payload?.headers || [];

        // Extract common email fields
        const fromHeader = headers.find((h: any) => h.name === 'From');
        const toHeader = headers.find((h: any) => h.name === 'To');
        const subjectHeader = headers.find((h: any) => h.name === 'Subject');
        const dateHeader = headers.find((h: any) => h.name === 'Date');

        return {
          id: message.id!,
          threadId: message.threadId!,
          labelIds: message.labelIds,
          snippet: message.snippet || '',
          internalDate: message.internalDate || '',
          date: dateHeader?.value || new Date(parseInt(message.internalDate || '0')).toISOString(),
          from: fromHeader ? { emailAddress: { address: fromHeader.value } } : undefined,
          to: toHeader ? { emailAddress: { address: toHeader.value } } : undefined,
          subject: subjectHeader?.value || '(no subject)',
          body: message.snippet || '', // Use snippet as body for processing
        };

      } catch (error) {
        console.error(`❌ Error fetching message ${msg.id}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    messages.push(...batchResults.filter(msg => msg !== null));
  }

  console.log(`✅ Successfully fetched ${messages.length} real Gmail messages for narrative`);
  return messages;
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: '/api/briefs/narrative' })
}

interface NarrativeBriefBody {
  emails?: any[]
  max_projects?: number
  include_clusters?: boolean
  use_real_data?: boolean
  user_id?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NarrativeBriefBody

    // Check if we should use real data
    const useRealData = body.use_real_data !== false && body.user_id;
    const userId = body.user_id || 'andrew.ledet@gmail.com';

    let emails: any[] = body.emails || [];
    let dataSource = 'provided';

    // If no emails provided and real data requested, fetch from Gmail
    if (useRealData && (!emails || emails.length === 0)) {
      try {
        console.log('🔄 Fetching real Gmail data for narrative brief...');
        emails = await fetchRealEmails(userId, 7, true); // 7 days, filter marketing
        dataSource = emails.length > 0 ? 'real' : 'mock';
        console.log(`✅ Successfully fetched ${emails.length} real emails for narrative`);
      } catch (error) {
        console.error('❌ Failed to fetch real emails for narrative:', error);
        emails = [];
        dataSource = 'mock';
      }
    }

    if (!Array.isArray(emails)) {
      return NextResponse.json({ error: 'Invalid payload: emails must be an array.' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)

    const doFetch = async (url: string) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emails: emails,
        max_projects: body.max_projects ?? 8,
        include_clusters: body.include_clusters ?? true,
      }),
      signal: controller.signal,
    })

    let apiResponse: Response
    try {
      apiResponse = await doFetch(PRIMARY_URL)
      if (!apiResponse.ok) {
        const fb = await doFetch(FALLBACK_URL)
        apiResponse = fb
      }
    } catch {
      apiResponse = await doFetch(FALLBACK_URL)
    }

    clearTimeout(timeout)

    if (!apiResponse.ok) {
      const text = await apiResponse.text()
      return new NextResponse(text || 'Upstream error from brief generator.', { status: apiResponse.status })
    }

    const data = await apiResponse.json()

    // Add metadata about data source
    if (data.feedback_metadata) {
      data.feedback_metadata.data_source = dataSource;
      data.feedback_metadata.real_emails_count = emails.length;
    }

    return NextResponse.json(data)
  } catch (error: any) {
    const message = error?.name === 'AbortError' ? 'Brief generation timed out.' : 'Internal Server Error while generating brief.'
    console.error('Narrative Brief Proxy Error:', error)
    return new NextResponse(message, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';

interface EmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload?: any;
  internalDate: string;
  date?: string;
  from?: any;
  to?: any;
  subject?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('days_back') || '7');
    const filterMarketing = searchParams.get('filter_marketing') !== 'false';
    const maxResults = parseInt(searchParams.get('max_results') || '50');

    console.log(`🔄 Fetching Gmail messages directly (using working logic)`);
    
    // Get current user - same as analytics page
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log(`⚠️ Authentication required for Gmail data`);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get Gmail access token from user_tokens table (same as analytics)
    console.log(`🔄 Looking for tokens for user: ${user.id}`);
    const { data: tokens, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token, expires_at, user_id, provider')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .limit(1);

    if (tokenError || !tokens || tokens.length === 0) {
      console.error('❌ No tokens found for user:', user.id);
      return NextResponse.json(
        { error: 'No authentication tokens found' },
        { status: 401 }
      );
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
          .eq('user_id', user.id)
          .eq('provider', 'google');

        token.access_token = credentials.access_token;
        console.log('✅ Successfully refreshed access token');
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        return NextResponse.json(
          { error: 'Token refresh failed' },
          { status: 401 }
        );
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
      maxResults: maxResults,
    });

    if (!listResponse.data.messages) {
      return NextResponse.json({
        emails: [],
        total_count: 0,
        query: query
      });
    }

    console.log(`📊 Found ${listResponse.data.messages.length} message IDs`);

    // Get full message details
    const messages: EmailMessage[] = [];
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
            payload: message.payload
          };
          
        } catch (error) {
          console.error(`❌ Error fetching message ${msg.id}:`, error);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      messages.push(...batchResults.filter(msg => msg !== null) as EmailMessage[]);
    }

    console.log(`✅ Successfully processed ${messages.length} messages`);

    return NextResponse.json({
      emails: messages,
      total_count: messages.length,
      query: query,
      processing_info: {
        requested: maxResults,
        found: listResponse.data.messages.length,
        processed: messages.length,
        days_back: daysBack,
        marketing_filtered: filterMarketing
      }
    });

  } catch (error) {
    console.error('❌ Error in get-messages API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
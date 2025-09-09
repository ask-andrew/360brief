import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';
import { getValidAccessToken } from '@/lib/gmail/oauth';

// Force Node.js runtime for service role operations
export const runtime = 'nodejs';

interface FullEmailMessage {
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
  body?: string;
  bodyHtml?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('days_back') || '7');
    const filterMarketing = searchParams.get('filter_marketing') !== 'false';
    const maxResults = parseInt(searchParams.get('max_results') || '50');

    console.log(`🔄 Fetching FULL Gmail messages for brief generation (${daysBack} days)`);
    
    // Get current user - try session first, then check for explicit user_id parameter
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const explicitUserId = searchParams.get('user_id');
    
    console.log(`🔍 Email endpoint auth check - session user:`, user ? { id: user.id, email: user.email } : null, 'error:', userError?.message, 'explicit user_id:', explicitUserId);
    
    let userId: string;
    if (user?.id) {
      // Session-based authentication (browser requests)
      userId = user.id;
      console.log(`✅ Using session-based auth for user: ${userId}`);
    } else if (explicitUserId) {
      // Server-to-server calls with explicit user_id
      userId = explicitUserId;
      console.log(`🔧 Using explicit user_id for server-to-server call: ${userId}`);
    } else {
      console.log(`⚠️ Authentication required - no session user and no explicit user_id`);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get valid access token using unified OAuth function
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(userId);
    } catch (error) {
      console.error('❌ Failed to get valid access token:', error);
      return NextResponse.json(
        { error: 'Authentication failed', details: error instanceof Error ? error.message : String(error) },
        { status: 401 }
      );
    }

    // Set up Gmail API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
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

    console.log(`📧 Gmail FULL content search query: ${query}`);

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

    console.log(`📊 Found ${listResponse.data.messages.length} message IDs for full processing`);

    // Get full message details with body content
    const messages: FullEmailMessage[] = [];
    const batchSize = 5; // Smaller batches since we're fetching full content
    
    for (let i = 0; i < Math.min(listResponse.data.messages.length, 30); i += batchSize) {
      const batch = listResponse.data.messages.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (msg) => {
        try {
          const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'full', // Full format for complete content
          });
          
          const message = fullMessage.data;
          const headers = message.payload?.headers || [];
          
          // Extract common email fields
          const fromHeader = headers.find((h: any) => h.name === 'From');
          const toHeader = headers.find((h: any) => h.name === 'To');
          const subjectHeader = headers.find((h: any) => h.name === 'Subject');
          const dateHeader = headers.find((h: any) => h.name === 'Date');
          
          // Extract email body content
          let body = '';
          let bodyHtml = '';
          
          function extractBodyContent(payload: any) {
            if (payload.body && payload.body.data) {
              const content = Buffer.from(payload.body.data, 'base64').toString('utf-8');
              if (payload.mimeType === 'text/plain') {
                body = content;
              } else if (payload.mimeType === 'text/html') {
                bodyHtml = content;
              }
            }
            
            if (payload.parts) {
              payload.parts.forEach((part: any) => {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                  body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                } else if (part.mimeType === 'text/html' && part.body?.data) {
                  bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
                }
                
                // Handle nested multipart messages
                if (part.parts) {
                  extractBodyContent(part);
                }
              });
            }
          }
          
          if (message.payload) {
            extractBodyContent(message.payload);
          }
          
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
            body: body || message.snippet || '',
            bodyHtml: bodyHtml,
            payload: message.payload
          };
          
        } catch (error) {
          console.error(`❌ Error fetching FULL message ${msg.id}:`, error);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      messages.push(...batchResults.filter(msg => msg !== null) as FullEmailMessage[]);
    }

    console.log(`✅ Successfully processed ${messages.length} FULL messages for briefs`);

    return NextResponse.json({
      emails: messages,
      total_count: messages.length,
      query: query,
      processing_info: {
        requested: maxResults,
        found: listResponse.data.messages.length,
        processed: messages.length,
        days_back: daysBack,
        marketing_filtered: filterMarketing,
        content_type: 'full_content',
        use_case: 'brief_generation'
      }
    });

  } catch (error) {
    console.error('❌ Error in get-full-messages API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch full messages', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
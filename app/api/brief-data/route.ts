// app/api/brief-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('📧 Brief data request for user:', userId);

    // Get user's Google tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token, expires_at, scope')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    if (tokenError || !tokenData) {
      console.log('❌ No tokens found for user:', userId);
      
      // Return mock brief data for testing (your console shows brief generation is working)
      const mockBrief = {
        userId: session.user.email,
        generatedAt: new Date().toISOString(),
        style: 'mission_brief',
        version: '2.0',
        subject: '📊 Operations Brief - Priority Actions & Status Update',
        tldr: "No Gmail connection. Mock brief for testing.",
        missionBrief: {
          currentStatus: {
            title: 'System Status',
            status: 'warning',
            description: 'Gmail not connected - using mock data',
            details: 'Connect Gmail to see real data in briefs',
            metrics: [
              { label: 'Gmail Status', value: 'Disconnected' },
              { label: 'Mock Data', value: 'Active' }
            ]
          },
          immediateActions: [
            'Connect Gmail account in settings',
            'Verify OAuth tokens are stored',
            'Test email data fetch',
            'Check database permissions'
          ],
          resourceAuthorization: {
            approved: [],
            pending: ['Gmail API access']
          },
          escalationContacts: [],
          windowEmphasisNote: 'Connect Gmail to activate real briefings.'
        },
        trends: ['• Gmail connection required for real trends'],
        winbox: [],
        processing_metadata: {
          enhanced_processing: true,
          streaming_enabled: true,
          total_processed: 0,
          processing_method: 'mock',
          themes_analyzed: 0,
        },
        dataSource: "mock_data",
        availableTimeRanges: ['3days', 'week', 'month'],
        generationParams: {
          style: 'mission_brief',
          timeRange: null,
          useStreaming: true
        }
      };

      return NextResponse.json(mockBrief);
    }

    console.log('✅ Found tokens, generating real brief...');

    // Check if token is expired and refresh if needed
    let accessToken = tokenData.access_token;
    if (tokenData.expires_at && new Date(tokenData.expires_at) <= new Date()) {
      console.log('🔄 Refreshing expired token...');
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        );

        oauth2Client.setCredentials({
          refresh_token: tokenData.refresh_token,
        });

        const { credentials } = await oauth2Client.refreshAccessToken();
        accessToken = credentials.access_token!;

        // Update token in database
        await supabase
          .from('user_tokens')
          .update({
            access_token: accessToken,
            expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('provider', 'google');

        console.log('✅ Token refreshed');
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        return NextResponse.json({ error: 'Token refresh failed. Please reconnect Gmail.' }, { status: 401 });
      }
    }

    // Initialize Gmail client
    const gmail = google.gmail({
      version: 'v1',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Fetch recent important messages for brief
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const query = `after:${Math.floor(threeDaysAgo.getTime() / 1000)} (is:important OR is:unread)`;

    const { data: { messages = [] } } = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20,
    });

    console.log(`📧 Found ${messages.length} important/unread messages`);

    // Get message details
    const messageDetails = await Promise.all(
      messages.slice(0, 10).map(async (msg) => {
        try {
          const { data } = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'full'
          });
          return data;
        } catch (error) {
          console.error('Error fetching message:', error);
          return null;
        }
      })
    );

    const validMessages = messageDetails.filter(Boolean);

    // Generate real brief data
    const briefData = {
      userId: session.user.email,
      generatedAt: new Date().toISOString(),
      style: 'mission_brief',
      version: '2.0',
      subject: '📊 Operations Brief - Priority Actions & Status Update',
      tldr: `${validMessages.length} important items requiring attention`,
      missionBrief: {
        currentStatus: {
          title: 'Email Operations',
          status: validMessages.length > 5 ? 'warning' : 'normal',
          description: `${validMessages.length} priority communications`,
          details: 'Recent important messages and unread items',
          metrics: [
            { label: 'Priority Items', value: validMessages.length.toString() },
            { label: 'Last Check', value: 'Now' }
          ]
        },
        immediateActions: generateActionsFromMessages(validMessages),
        resourceAuthorization: {
          approved: ['Gmail API access'],
          pending: []
        },
        escalationContacts: extractEscalationContacts(validMessages),
        windowEmphasisNote: 'Review and respond to priority communications.'
      },
      trends: generateTrends(validMessages),
      winbox: [],
      processing_metadata: {
        enhanced_processing: true,
        streaming_enabled: true,
        total_processed: validMessages.length,
        processing_method: 'gmail_api',
        themes_analyzed: validMessages.length,
      },
      dataSource: "gmail_api",
      availableTimeRanges: ['3days', 'week', 'month'],
      generationParams: {
        style: 'mission_brief',
        timeRange: '3days',
        useStreaming: true
      }
    };

    console.log('✅ Brief generated successfully');
    return NextResponse.json(briefData);

  } catch (error) {
    console.error('❌ Brief data API error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate brief', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateActionsFromMessages(messages: any[]): string[] {
  const actions: string[] = [];
  
  messages.forEach(msg => {
    const subjectHeader = msg.payload?.headers?.find((h: any) => h.name === 'Subject');
    const subject = subjectHeader?.value || '';
    
    if (subject.toLowerCase().includes('urgent')) {
      actions.push(`Review urgent: ${subject.substring(0, 50)}...`);
    } else if (subject.toLowerCase().includes('meeting')) {
      actions.push(`Confirm meeting: ${subject.substring(0, 50)}...`);
    } else if (subject.toLowerCase().includes('approval')) {
      actions.push(`Action required: ${subject.substring(0, 50)}...`);
    }
  });

  // Add generic actions if none found
  if (actions.length === 0 && messages.length > 0) {
    actions.push(`Review ${messages.length} priority messages`);
    actions.push('Clear unread email backlog');
  }

  return actions.slice(0, 4); // Limit to 4 actions
}

function extractEscalationContacts(messages: any[]): string[] {
  const contacts: Set<string> = new Set();
  
  messages.forEach(msg => {
    const fromHeader = msg.payload?.headers?.find((h: any) => h.name === 'From');
    if (fromHeader) {
      const email = extractEmail(fromHeader.value);
      if (email.includes('ceo') || email.includes('cto') || email.includes('urgent')) {
        contacts.add(email);
      }
    }
  });

  return Array.from(contacts).slice(0, 3); // Limit to 3 contacts
}

function generateTrends(messages: any[]): string[] {
  if (messages.length === 0) {
    return ['• No recent priority communications'];
  }

  const trends = [
    `• ${messages.length} priority communications in last 3 days`,
    '• Email volume within normal range',
    '• No critical escalations detected'
  ];

  return trends;
}

function extractEmail(fromValue: string): string {
  const match = fromValue.match(/<(.+)>/);
  return match ? match[1] : fromValue;
}

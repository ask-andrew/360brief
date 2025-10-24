import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface IntelligenceBrief {
  userId: string;
  generatedAt: string;
  style: string;
  version: string;
  dataSource: string;
  executiveSummary: string;
  keyInsights: Array<{
    insight_type: string;
    title: string;
    description: string;
    importance: string;
  }>;
  priorityItems: Array<{
    title: string;
    from: string;
    priority_level: string;
    reasoning: string;
    action_required: string;
    urgency_score: number;
  }>;
  businessSignals: Array<{
    type: string;
    priority: number;
    title: string;
    description: string;
    stakeholders: string[];
    business_category: string;
    confidence: number;
  }>;
  stakeholderIntelligence: {
    total_stakeholders: number;
    key_stakeholders: Record<string, {
      communication_frequency: number;
      influence_score: number;
      primary_topics: Array<[string, number]>;
      recent_activity: number;
    }>;
    communication_distribution: Record<string, number>;
    network_health: string;
  };
  actionIntelligence: {
    action_items: Array<{
      action: string;
      source_email: string;
      from: string;
      urgency: string;
    }>;
    follow_ups_needed: Array<{
      subject: string;
      from: string;
      follow_up_type: string;
    }>;
    decisions_needed: Array<{
      subject: string;
      from: string;
      decision_type: string;
    }>;
    actionability_score: number;
  };
  communicationPatterns: {
    volume_metrics: {
      total_emails: number;
      daily_average: number;
      busiest_day: string | null;
      volume_trend: string;
    };
    response_patterns: any;
    sender_analysis: any;
    thread_analysis: any;
  };
  trendsAndPatterns: {
    topic_frequencies: Record<string, number>;
    temporal_patterns: any;
    communication_styles: any;
    recurring_themes: Array<{
      theme: string;
      frequency: number;
      examples: string[];
    }>;
    pattern_insights: string[];
  };
  efficiencyMetrics: {
    total_communications: number;
    responses_needed: number;
    response_rate: number;
    thread_efficiency: any;
    content_quality: any;
    communication_load: string;
    efficiency_recommendations: string[];
  };
  processing_metadata: {
    emails_processed: number;
    processing_method: string;
    intelligence_level: string;
    processing_time: string;
    intelligence_signals_detected: number;
    stakeholders_analyzed: number;
    patterns_identified: number;
    value_tier: string;
  };
}

async function fetchRealEmails(userId: string, daysBack: number, filterMarketing: boolean): Promise<any[]> {
  // Fetch real emails from Gmail for the authenticated user
  console.log(`🔄 Fetching real Gmail data for user: ${userId}`);

  // Get Gmail access token from user_tokens table
  const { data: tokens, error: tokenError } = await supabase
    .from('user_tokens')
    .select('access_token, refresh_token, expires_at, user_id, provider')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .limit(1);

  if (tokenError || !tokens || tokens.length === 0) {
    console.error('❌ No tokens found for user:', userId);
    throw new Error('No Gmail authentication tokens found');
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
      throw new Error('Token refresh failed');
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

  console.log(`✅ Successfully fetched ${messages.length} real Gmail messages`);
  return messages;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id') || 'andrew.ledet@gmail.com';
  const daysBack = parseInt(url.searchParams.get('days_back') || '7');
  const filterMarketing = url.searchParams.get('filter_marketing') !== 'false';
  const useIntelligence = url.searchParams.get('use_intelligence') !== 'false';
  const useRealData = url.searchParams.get('use_real_data') === 'true';

  try {
    console.log(`📝 Generating executive brief for ${userId}`);

    if (!useIntelligence) {
      // Return basic brief format
      return NextResponse.json({
        userId,
        generatedAt: new Date().toISOString(),
        style: 'basic',
        version: '1.0',
        dataSource: 'basic_analytics',
        executiveSummary: 'Basic brief generation requested - sophisticated intelligence disabled',
        message: 'Use use_intelligence=true to enable advanced intelligence features'
      });
    }

    // Check if we should use real data (for testing, use hardcoded user ID)
    const realDataEnabled = useRealData;

    let emails: any[] = [];
    let dataSource = 'mock';

    if (realDataEnabled) {
      try {
        console.log('🔄 Attempting to fetch real Gmail data...');
        emails = await fetchRealEmails(userId, daysBack, filterMarketing);
        dataSource = emails.length > 0 ? 'real' : 'mock';
        console.log(`✅ Successfully fetched ${emails.length} real emails`);
      } catch (error) {
        console.error('❌ Failed to fetch real emails:', error);
        console.log('🔄 Falling back to mock data...');
        emails = []; // Python service will generate mock data
        dataSource = 'mock';
      }
    } else {
      console.log('📝 Using mock data for testing');
      emails = [];
      dataSource = 'mock';
    }

    // Call Python intelligence service with email data
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

    const requestBody = {
      user_id: userId,
      emails: emails, // Pass real emails if available, empty array for mock data
      days_back: daysBack,
      filter_marketing: filterMarketing
    };

    console.log(`🔗 Calling Python service: ${pythonServiceUrl}/generate-brief`);
    console.log(`📊 Email count: ${emails.length}, Data source: ${dataSource}`);

    const response = await fetch(`${pythonServiceUrl}/generate-brief`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      // Increase timeout for intelligence processing
      signal: AbortSignal.timeout(120000) // 2 minutes
    });

    if (!response.ok) {
      throw new Error(`Python service error: ${response.status} ${response.statusText}`);
    }

    const intelligenceBrief: IntelligenceBrief = await response.json();

    console.log(`✅ Generated sophisticated brief with ${intelligenceBrief.processing_metadata?.intelligence_signals_detected || 0} signals`);

    // Transform to format expected by frontend components
    const transformedBrief = {
      id: `brief-${Date.now()}`,
      title: 'Executive Intelligence Brief',
      userId: intelligenceBrief.userId,
      generatedAt: intelligenceBrief.generatedAt,
      style: 'sophisticated_intelligence',
      version: intelligenceBrief.version,
      dataSource: dataSource, // Use our determined data source

      // Core brief content
      summary: intelligenceBrief.executiveSummary,
      tldr: intelligenceBrief.executiveSummary,

      // Intelligence sections
      executiveSummary: intelligenceBrief.executiveSummary,
      keyInsights: intelligenceBrief.keyInsights || [],
      priorityItems: intelligenceBrief.priorityItems || [],
      businessSignals: intelligenceBrief.businessSignals || [],
      stakeholderIntelligence: intelligenceBrief.stakeholderIntelligence,
      actionIntelligence: intelligenceBrief.actionIntelligence,
      communicationPatterns: intelligenceBrief.communicationPatterns,
      trendsAndPatterns: intelligenceBrief.trendsAndPatterns,
      efficiencyMetrics: intelligenceBrief.efficiencyMetrics,

      // Metrics in dashboard format
      metrics: [
        {
          name: 'Communications Processed',
          value: intelligenceBrief.processing_metadata?.emails_processed?.toString() || '0'
        },
        {
          name: 'Business Signals',
          value: intelligenceBrief.processing_metadata?.intelligence_signals_detected?.toString() || '0'
        },
        {
          name: 'Key Stakeholders',
          value: intelligenceBrief.stakeholderIntelligence?.total_stakeholders?.toString() || '0'
        },
        {
          name: 'Action Items',
          value: intelligenceBrief.actionIntelligence?.action_items?.length?.toString() || '0'
        }
      ],

      // Extract highlights from key insights
      highlights: intelligenceBrief.keyInsights?.map(insight => ({
        type: insight.insight_type,
        title: insight.title,
        description: insight.description,
        importance: insight.importance
      })) || [],

      // Extract blockers from business signals
      blockers: intelligenceBrief.businessSignals
        ?.filter(signal => signal.type === 'blocker')
        ?.map(blocker => ({
          title: blocker.title,
          description: blocker.description,
          priority: blocker.priority,
          stakeholders: blocker.stakeholders
        })) || [],

      // Extract next steps from action intelligence
      nextSteps: intelligenceBrief.actionIntelligence?.action_items
        ?.slice(0, 5)
        ?.map(action => ({
          action: action.action,
          priority: action.urgency,
          source: action.source_email
        })) || [],

      // Processing metadata
      processing_metadata: {
        ...intelligenceBrief.processing_metadata,
        data_source: dataSource,
        real_emails_fetched: emails.length
      },

      // Timeframe
      timeframe: {
        start: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    };

    return NextResponse.json(transformedBrief);

  } catch (error) {
    console.error('❌ Error generating executive brief:', error);

    // Return fallback brief
    const fallbackBrief = {
      id: `brief-${Date.now()}`,
      title: 'Executive Brief (Fallback)',
      userId,
      generatedAt: new Date().toISOString(),
      style: 'fallback',
      version: '1.0',
      dataSource: 'fallback_error',
      summary: 'Brief generation temporarily unavailable. Intelligence service may be starting up.',
      tldr: 'Brief generation temporarily unavailable',
      executiveSummary: 'Brief generation temporarily unavailable. Please try again in a moment.',
      error: error instanceof Error ? error.message : 'Unknown error',
      metrics: [
        { name: 'Status', value: 'Service Unavailable' }
      ],
      highlights: [],
      blockers: [],
      nextSteps: [],
      timeframe: {
        start: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    };

    return NextResponse.json(fallbackBrief, { status: 200 }); // Return 200 with fallback data
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, daysBack = 7, filterMarketing = true, useIntelligence = true, useRealData = false } = body;

    // Redirect to GET with query parameters
    const url = new URL(req.url);
    url.searchParams.set('user_id', userId || 'andrew.ledet@gmail.com');
    url.searchParams.set('days_back', daysBack.toString());
    url.searchParams.set('filter_marketing', filterMarketing.toString());
    url.searchParams.set('use_intelligence', useIntelligence.toString());
    url.searchParams.set('use_real_data', useRealData.toString());

    const getRequest = new NextRequest(url.toString(), { method: 'GET' });
    return await GET(getRequest);

  } catch (error) {
    console.error('❌ Error in POST /api/brief:', error);
    return NextResponse.json(
      { error: 'Failed to generate brief', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id') || 'andrew.ledet@gmail.com';
  const daysBack = parseInt(url.searchParams.get('days_back') || '7');
  const filterMarketing = url.searchParams.get('filter_marketing') !== 'false';
  const useIntelligence = url.searchParams.get('use_intelligence') !== 'false';

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

    // Call Python intelligence service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

    const requestBody = {
      user_id: userId,
      days_back: daysBack,
      filter_marketing: filterMarketing
    };

    console.log(`🔗 Calling Python service: ${pythonServiceUrl}/generate-brief`);

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
      dataSource: intelligenceBrief.dataSource,

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
      processing_metadata: intelligenceBrief.processing_metadata,

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
    const { userId, daysBack = 7, filterMarketing = true, useIntelligence = true } = body;

    // Redirect to GET with query parameters
    const url = new URL(req.url);
    url.searchParams.set('user_id', userId || 'andrew.ledet@gmail.com');
    url.searchParams.set('days_back', daysBack.toString());
    url.searchParams.set('filter_marketing', filterMarketing.toString());
    url.searchParams.set('use_intelligence', useIntelligence.toString());

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
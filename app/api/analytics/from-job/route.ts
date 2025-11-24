/**
 * Analytics From Job API
 * GET /api/analytics/from-job
 * 
 * Retrieves analytics data from completed background jobs
 * Uses cached message data to compute analytics quickly
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMessageCacheService } from '@/services/analytics/messageCacheService';
import { computeAnalytics } from '@/services/analytics/processor';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('daysBack') || '7');

    console.log(`📊 Fetching analytics from cache for user ${user.id} (${daysBack} days)`);

    // Get cached messages
    const cacheService = getMessageCacheService();
    const messages = await cacheService.getMessages(user.id, {
      limit: 1000,
      daysBack,
    });

    if (!messages || messages.length === 0) {
      console.log('⚠️ No cached messages found');
      return NextResponse.json({
        total_count: 0,
        inbound_count: 0,
        outbound_count: 0,
        avg_response_time_minutes: 0,
        missed_messages: 0,
        focus_ratio: 0,
        external_percentage: 0,
        internal_percentage: 0,
        top_projects: [],
        reconnect_contacts: [],
        recent_trends: {
          messages: { change: 0, direction: 'up' as const },
          response_time: { change: 0, direction: 'down' as const },
          meetings: { change: 0, direction: 'up' as const },
        },
        sentiment_analysis: {
          positive: 0,
          neutral: 0,
          negative: 0,
          overall_trend: 'neutral' as const,
        },
        priority_messages: {
          awaiting_my_reply: [],
          awaiting_their_reply: [],
        },
        channel_analytics: {
          by_channel: [{ name: 'Email', count: 0, percentage: 100 }],
          by_time: [],
        },
        message_distribution: {
          by_day: [],
          by_sender: [],
        },
        network_data: {
          nodes: [],
          connections: [],
        },
        dataSource: 'cache',
        processing_metadata: {
          source: 'from-job-api',
          processed_at: new Date().toISOString(),
          message_count: 0,
          days_analyzed: daysBack,
          is_real_data: false,
        },
      });
    }

    console.log(`✅ Found ${messages.length} cached messages`);

    // Convert cached messages to Gmail format for processor
    const gmailMessages = messages.map((msg) => ({
      id: msg.message_id,
      threadId: msg.thread_id,
      internalDate: msg.internal_date ? new Date(msg.internal_date).getTime().toString() : Date.now().toString(),
      payload: {
        headers: [
          { name: 'From', value: msg.from_email || '' },
          { name: 'To', value: msg.to_emails?.join(', ') || '' },
          { name: 'Subject', value: msg.subject || '' },
        ],
      },
    }));

    // Compute analytics from cached data
    const analyticsData = computeAnalytics({
      gmail: gmailMessages as any,
      calendar: [], // Calendar data not yet cached
      daysBack,
      userEmail: user.email ?? undefined,
    });

    // Add metadata and ensure all required fields are present with proper defaults
    const response = {
      ...analyticsData,
      // Ensure all array fields exist
      top_projects: analyticsData.top_projects || [],
      reconnect_contacts: analyticsData.reconnect_contacts || [],
      // Ensure recent_trends exists with proper structure
      recent_trends: analyticsData.recent_trends || {
        messages: { change: 0, direction: 'up' as const },
        response_time: { change: 0, direction: 'down' as const },
        meetings: { change: 0, direction: 'up' as const },
      },
      // Ensure priority_messages exists
      priority_messages: {
        awaiting_my_reply: analyticsData.priority_messages?.awaiting_my_reply || [],
        awaiting_their_reply: analyticsData.priority_messages?.awaiting_their_reply || [],
      },
      // Ensure sentiment_analysis exists
      sentiment_analysis: analyticsData.sentiment_analysis || {
        positive: 0,
        neutral: 0,
        negative: 0,
        overall_trend: 'neutral' as const,
      },
      // Ensure channel_analytics exists with all sub-arrays
      channel_analytics: {
        by_channel: analyticsData.channel_analytics?.by_channel || [{ name: 'Email', count: 0, percentage: 100 }],
        by_time: analyticsData.channel_analytics?.by_time || [],
      },
      // Ensure message_distribution exists
      message_distribution: {
        by_day: analyticsData.message_distribution?.by_day || [],
        by_sender: analyticsData.message_distribution?.by_sender || [],
      },
      // Ensure network_data exists
      network_data: {
        nodes: analyticsData.network_data?.nodes || [],
        connections: analyticsData.network_data?.connections || [],
      },
      dataSource: 'cache',
      processing_metadata: {
        source: 'from-job-api',
        processed_at: new Date().toISOString(),
        message_count: messages.length,
        days_analyzed: daysBack,
        is_real_data: true,
        cache_hit: true,
      },
    };

    console.log(`✅ Analytics computed from ${messages.length} cached messages`);

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=60' }, // Cache for 1 minute
    });

  } catch (error) {
    console.error('Error fetching analytics from job:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics from job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

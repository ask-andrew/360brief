import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGmailAccessToken, fetchGmailMessages, analyzeGmailData } from '../../../../src/lib/gmail-api';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({
        error: 'Authentication required',
        message: 'Please sign in to access your Gmail data'
      }, {
        status: 401,
      });
    }
    
    console.log(`Fetching Gmail data for user: ${user.id}`);
    
    // Get Gmail access token from user_tokens table
    const accessToken = await getGmailAccessToken(user.id);
    
    if (!accessToken) {
      // Check if this is due to missing or expired token
      const { data: tokenData } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();
      
      const errorResponse = {
        error: tokenData ? 'Token expired' : 'Gmail not connected',
        message: tokenData 
          ? 'Your Gmail connection requires re-authentication' 
          : 'Please connect your Gmail account first',
        connect_url: '/dashboard'
      };
      
      return NextResponse.json(errorResponse, {
        status: tokenData ? 401 : 403,
      });
    }
    
    console.log('Gmail access token found, fetching messages...');
    
    // Fetch Gmail messages
    let messages;
    try {
      messages = await fetchGmailMessages(accessToken, 100);
    } catch (fetchError) {
      console.error('Error fetching Gmail messages:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch messages',
        message: 'Unable to connect to Gmail. Please try reconnecting.',
        connect_url: '/dashboard'
      }, {
        status: 500,
      });
    }
    
    console.log(`Fetched ${messages.length} Gmail messages`);
    
    // Analyze the data
    const userEmail = user.email || '';
    const analytics = analyzeGmailData(messages, userEmail);
    
    console.log(`✅ Gmail analytics generated successfully - ${analytics.total_count} messages analyzed`);
    
    // Cache the results in the database (optional for MVP)
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      
      await supabase
        .from('user_analytics_cache')
        .upsert({
          user_id: user.id,
          provider: 'gmail',
          data: analytics,
          cached_at: now.toISOString(),
          expires_at: expiresAt.toISOString() // Use consistent ISO timestamp format
        });
      
      console.log('✅ Analytics data cached successfully');
    } catch (cacheError) {
      console.warn('⚠️ Failed to cache analytics data:', cacheError);
      // Continue without caching - not critical for MVP
    }
    
    return NextResponse.json(analytics, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
      },
    });
    
  } catch (error) {
    console.error('Gmail analytics error:', error);
    
    // Return fallback data if Gmail API fails
    const fallbackData = {
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
        messages: { change: 0, direction: "up" as const },
        response_time: { change: 0, direction: "down" as const },
        meetings: { change: 0, direction: "up" as const }
      },
      sentiment_analysis: {
        positive: 0,
        neutral: 0,
        negative: 0,
        overall_trend: "neutral" as const
      },
      priority_messages: {
        awaiting_my_reply: [],
        awaiting_their_reply: []
      },
      channel_analytics: {
        by_channel: [],
        by_time: []
      },
      network_data: {
        nodes: [],
        connections: []
      },
      error: error instanceof Error ? error.message : 'Failed to fetch Gmail data'
    };

    return NextResponse.json(fallbackData, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  }
}
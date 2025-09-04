import { NextResponse } from 'next/server';
import { generateStyledBrief } from '@/server/briefs/generateBrief';

// Convert analytics data directly to UnifiedData format (same as unifiedDataService.ts)
function convertAnalyticsToUnifiedData(analyticsData: any) {
  const emails = [];
  
  // Convert priority messages to email format
  if (analyticsData.priority_messages) {
    // Add awaiting my reply messages
    if (analyticsData.priority_messages.awaiting_my_reply) {
      for (const msg of analyticsData.priority_messages.awaiting_my_reply) {
        emails.push({
          id: msg.id,
          messageId: msg.id,
          subject: msg.subject,
          body: `From: ${msg.sender}\nChannel: ${msg.channel}\nPriority: ${msg.priority}\nTimestamp: ${msg.timestamp}`,
          from: msg.sender,
          to: ['me'], // Simplified
          date: new Date(msg.timestamp || new Date()).toISOString(),
          metadata: {
            insights: {
              priority: msg.priority,
              hasActionItems: true, // Since it's awaiting reply
              isUrgent: msg.priority === 'high'
            }
          }
        });
      }
    }
    
    // Add awaiting their reply messages
    if (analyticsData.priority_messages.awaiting_their_reply) {
      for (const msg of analyticsData.priority_messages.awaiting_their_reply) {
        emails.push({
          id: msg.id,
          messageId: msg.id,
          subject: msg.subject,
          body: `From: ${msg.sender}\nChannel: ${msg.channel}\nPriority: ${msg.priority}\nTimestamp: ${msg.timestamp}`,
          from: 'me',
          to: [msg.sender],
          date: new Date(msg.timestamp || new Date()).toISOString(),
          metadata: {
            insights: {
              priority: msg.priority,
              hasActionItems: false, // Waiting for their reply
              isUrgent: msg.priority === 'high'
            }
          }
        });
      }
    }
  }

  return {
    emails,
    incidents: [],
    calendarEvents: [],
    tickets: [],
    generated_at: new Date().toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const style = searchParams.get('style') || 'mission_brief';
    const useRealData = searchParams.get('use_real_data') === 'true';
    
    // Validate style parameter
    const validStyles = ['mission_brief', 'startup_velocity', 'management_consulting', 'newsletter'];
    const briefStyle = validStyles.includes(style) ? style as any : 'mission_brief';

    let unified;
    let dataSource = 'mock';

    if (useRealData) {
      try {
        // Fetch real analytics data directly (no auth required) with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const analyticsResponse = await fetch('http://localhost:8000/analytics?use_real_data=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          console.log(`📊 Analytics response:`, {
            total_count: analyticsData.total_count,
            has_priority_messages: !!analyticsData.priority_messages,
            awaiting_my_reply_count: analyticsData.priority_messages?.awaiting_my_reply?.length || 0
          });
          
          if (analyticsData.total_count > 0) {
            unified = convertAnalyticsToUnifiedData(analyticsData);
            dataSource = 'real';
            console.log(`✅ Demo brief using real data with ${analyticsData.total_count} messages, ${unified.emails.length} converted emails`);
          } else {
            console.log(`⚠️ Analytics data has zero total_count, falling back to mock`);
          }
        } else {
          console.log(`❌ Analytics response not ok:`, analyticsResponse.status, analyticsResponse.statusText);
        }
      } catch (error) {
        console.log(`❌ Real data fetch failed for demo:`, error);
      }
    }

    // Fallback to mock data if real data not available
    if (!unified) {
      const { normalOperationsScenario } = await import('@/mocks/data/testScenarios');
      unified = normalOperationsScenario;
      dataSource = useRealData ? 'real_fallback' : 'mock';
    }

    // Generate the styled brief
    const briefData = generateStyledBrief(unified, briefStyle);
    
    return NextResponse.json({
      ...briefData,
      dataSource,
      generatedAt: new Date().toISOString(),
      message: dataSource === 'real' 
        ? `Generated from ${unified.emails.length} real priority messages`
        : 'Using demo data for preview',
      availableStyles: validStyles,
    });
    
  } catch (e: any) {
    console.error('Demo brief generation error:', e);
    return NextResponse.json({ 
      error: e?.message ?? 'Failed to generate demo brief',
      dataSource: 'error'
    }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { generateBrief, generateStyledBrief } from '@/server/briefs/generateBrief';
import { fetchUnifiedData } from '@/services/unifiedDataService';
import { createClient } from '@/lib/supabase/server';
import { crisisScenario, normalOperationsScenario, highActivityScenario } from '@/mocks/data/testScenarios';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let startDate = searchParams.get('start');
    let endDate = searchParams.get('end');
    const timeRange = searchParams.get('time_range'); // week, month, custom
    const useRealData = searchParams.get('use_real_data') === 'true';
    const style = searchParams.get('style') || 'mission_brief';
    const scenario = searchParams.get('scenario') || 'normal'; // crisis, normal, high_activity
    
    // Handle convenient time range presets
    if (timeRange && !startDate && !endDate) {
      const now = new Date();
      const end = now.toISOString();
      let start: Date;
      
      switch (timeRange) {
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3days':
          start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to week
      }
      
      startDate = start.toISOString();
      endDate = end;
    }
    
    // Validate style parameter
    const validStyles = ['mission_brief', 'startup_velocity', 'management_consulting', 'newsletter'];
    const briefStyle = validStyles.includes(style) ? style as any : 'mission_brief';

    let unified;
    
    if (useRealData) {
      // Resolve authenticated user for real data
      const supabase = await createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Fetch real unified data with full content for briefs
      unified = await fetchUnifiedData(user.id, { 
        startDate: startDate ?? undefined, 
        endDate: endDate ?? undefined,
        useCase: 'brief'
      });
      
      console.log('🔍 Real unified data counts:', {
        emails: unified.emails.length,
        incidents: unified.incidents.length,
        calendarEvents: unified.calendarEvents.length,
        tickets: unified.tickets.length,
        totalEmails: unified.emails.length,
        sampleEmail: unified.emails[0]?.subject,
        source: 'fetchUnifiedData',
        willFallback: !unified.emails.length && !unified.incidents.length && 
                     !unified.calendarEvents.length && !unified.tickets.length
      });
      
      // If no real data available, fall back to mock data with warning
      if (!unified.emails.length && !unified.incidents.length && 
          !unified.calendarEvents.length && !unified.tickets.length) {
        unified = getScenarioData(scenario);
        return NextResponse.json({
          ...generateStyledBrief(unified, briefStyle),
          dataSource: 'mock',
          warning: 'Gmail connected but no recent messages found. Try again later or check your Gmail filters.'
        });
      }
    } else {
      // Use mock scenario data
      unified = getScenarioData(scenario);
    }

    // Generate the styled brief
    const briefData = generateStyledBrief(unified, briefStyle);
    
    return NextResponse.json({
      ...briefData,
      dataSource: useRealData ? 'real' : 'mock',
      scenario: useRealData ? undefined : scenario,
      timeRange: timeRange || 'week',
      availableStyles: validStyles,
      availableScenarios: ['normal', 'crisis', 'high_activity'],
      availableTimeRanges: ['3days', 'week', 'month'],
      rawAnalyticsData: unified // Include raw data for LLM experimentation
    });
    
  } catch (e: any) {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      endpoint: '/api/briefs/enhanced',
      method: 'GET',
      error: e?.message ?? 'Unknown error',
      stack: e?.stack,
      userAgent: req.headers.get('user-agent'),
    };
    
    console.error('📋 Enhanced brief generation error:', JSON.stringify(errorDetails, null, 2));
    
    // Return user-friendly error with debugging info
    return NextResponse.json({ 
      error: 'Brief generation failed',
      message: e?.message?.includes('token') ? 'Gmail connection expired. Please reconnect your account.' :
               e?.message?.includes('scope') ? 'Gmail permissions insufficient. Please reconnect with full access.' :
               e?.message?.includes('quota') ? 'Gmail API quota exceeded. Please try again later.' :
               'Unable to generate brief. Please try again or contact support.',
      dataSource: 'error',
      timestamp: errorDetails.timestamp,
      ...(process.env.NODE_ENV === 'development' && { debug: errorDetails })
    }, { status: 500 });
  }
}

function getScenarioData(scenario: string) {
  switch (scenario) {
    case 'crisis':
      return crisisScenario;
    case 'high_activity':
      return highActivityScenario;
    case 'normal':
    default:
      return normalOperationsScenario;
  }
}

// Enhanced POST method for generating briefs with custom parameters
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      style = 'mission_brief',
      useRealData = false,
      scenario = 'normal',
      timeRange,
      customData 
    } = body;

    // Validate inputs
    const validStyles = ['mission_brief', 'startup_velocity', 'management_consulting', 'newsletter'];
    const briefStyle = validStyles.includes(style) ? style as any : 'mission_brief';
    
    let unified;
    
    if (customData) {
      // Use provided custom data (for testing/demos)
      unified = customData;
    } else if (useRealData) {
      const supabase = await createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      try {
        unified = await fetchUnifiedData(user.id, {
          startDate: timeRange?.start,
          endDate: timeRange?.end,
          useCase: 'brief'
        });
        
        // If no real data available, fall back to demo data
        if (!unified.emails.length && !unified.incidents.length && 
            !unified.calendarEvents.length && !unified.tickets.length) {
          unified = getScenarioData('normal');
          const briefData = generateStyledBrief(unified, briefStyle);
          return NextResponse.json({
            ...briefData,
            dataSource: 'mock',
            warning: 'No recent data available. Using demo data instead. Connect your Gmail for personalized briefs.'
          });
        }
      } catch (error) {
        console.error('Real data fetch failed, falling back to demo:', error);
        unified = getScenarioData('normal');
        const briefData = generateStyledBrief(unified, briefStyle);
        return NextResponse.json({
          ...briefData,
          dataSource: 'mock',
          warning: 'Unable to access your data. Using demo data instead. Please check your Gmail connection.'
        });
      }
    } else {
      unified = getScenarioData(scenario);
    }

    const briefData = generateStyledBrief(unified, briefStyle);
    
    return NextResponse.json({
      ...briefData,
      dataSource: customData ? 'custom' : (useRealData ? 'real' : 'mock'),
      generationParams: {
        style: briefStyle,
        scenario: useRealData ? undefined : scenario,
        timeRange
      },
      availableTimeRanges: ['3days', 'week', 'month'],
      rawAnalyticsData: unified // Include raw data for LLM experimentation
    });
    
  } catch (e: any) {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      endpoint: '/api/briefs/enhanced',
      method: 'POST',
      error: e?.message ?? 'Unknown error',
      stack: e?.stack,
      userAgent: req.headers.get('user-agent'),
    };
    
    console.error('📋 Enhanced brief generation error (POST):', JSON.stringify(errorDetails, null, 2));
    
    return NextResponse.json({ 
      error: 'Brief generation failed',
      message: e?.message?.includes('token') ? 'Gmail connection expired. Please reconnect your account.' :
               e?.message?.includes('scope') ? 'Gmail permissions insufficient. Please reconnect with full access.' :
               e?.message?.includes('quota') ? 'Gmail API quota exceeded. Please try again later.' :
               'Unable to generate brief. Please try again or contact support.',
      dataSource: 'error',
      timestamp: errorDetails.timestamp,
      ...(process.env.NODE_ENV === 'development' && { debug: errorDetails })
    }, { status: 500 });
  }
}
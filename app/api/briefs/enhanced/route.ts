import { NextResponse } from 'next/server';
import { generateBrief, generateStyledBrief } from '@/server/briefs/generateBrief';
import { fetchUnifiedData } from '@/services/unifiedDataService';
import { createClient } from '@/lib/supabase/server';
import { crisisScenario, normalOperationsScenario, highActivityScenario } from '@/mocks/data/testScenarios';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const useRealData = searchParams.get('use_real_data') === 'true';
    const style = searchParams.get('style') || 'mission_brief';
    const scenario = searchParams.get('scenario') || 'normal'; // crisis, normal, high_activity
    
    // Validate style parameter
    const validStyles = ['mission_brief', 'startup_velocity', 'management_consulting', 'newsletter'];
    const briefStyle = validStyles.includes(style) ? style as any : 'mission_brief';

    let unified;
    
    if (useRealData) {
      // Resolve authenticated user for real data
      const supabase = await createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return NextResponse.json({ error: 'Authentication required for real data' }, { status: 401 });
      }

      // Fetch real unified data
      unified = await fetchUnifiedData(user.id, { 
        startDate: startDate ?? undefined, 
        endDate: endDate ?? undefined 
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
      availableStyles: validStyles,
      availableScenarios: ['normal', 'crisis', 'high_activity']
    });
    
  } catch (e: any) {
    console.error('Enhanced brief generation error:', e);
    return NextResponse.json({ 
      error: e?.message ?? 'Failed to generate enhanced brief',
      dataSource: 'error'
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
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      unified = await fetchUnifiedData(user.id, {
        startDate: timeRange?.start,
        endDate: timeRange?.end
      });
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
      }
    });
    
  } catch (e: any) {
    return NextResponse.json({ 
      error: e?.message ?? 'Failed to generate brief',
      dataSource: 'error'
    }, { status: 500 });
  }
}
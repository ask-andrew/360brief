import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

type DigestStyle = 'mission-brief' | 'management-consulting' | 'startup-velocity' | 'newsletter';
type Frequency = 'daily' | 'weekly' | 'weekdays' | 'custom';
type DeliveryMode = 'email' | 'slack' | 'audio';

export interface UserPreferences {
  digestStyle: DigestStyle;
  frequency: Frequency;
  deliveryMode: DeliveryMode;
  filterMarketing: boolean;
  customDays?: number[];
  customTime?: string;
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Fetch user preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }
    
    // Return default preferences if none found
    if (!data) {
      const defaultPreferences: UserPreferences = {
        digestStyle: 'mission-brief',
        frequency: 'weekly',
        deliveryMode: 'email',
        filterMarketing: true,
        customTime: '08:00',
      };
      
      // Save default preferences
      const { error: insertError } = await supabase
        .from('user_preferences')
        .insert([{ 
          user_id: user.id, 
          preferences: defaultPreferences 
        }]);
      
      if (insertError) {
        console.error('Error saving default preferences:', insertError);
      }
      
      return NextResponse.json(defaultPreferences);
    }
    
    return NextResponse.json(data.preferences);
    
  } catch (error) {
    console.error('Error in GET /api/user/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const preferences: UserPreferences = await request.json();
    
    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }
    
    // Update or insert preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        preferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select('preferences')
      .single();
    
    if (error) {
      console.error('Error saving preferences:', error);
      return NextResponse.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data.preferences);
    
  } catch (error) {
    console.error('Error in POST /api/user/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

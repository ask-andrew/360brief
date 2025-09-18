import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Default preferences that match our database schema
const DEFAULT_PREFERENCES = {
  timezone: 'UTC',
  digest_frequency: 'daily',
  digest_time: '07:00',
  // Use a valid BriefStyle as default
  digest_style: 'mission_brief',
  // Reuse preferred_format to optionally store 'concise' | 'detailed' view choice for UI
  preferred_format: 'concise',
  email_notifications: true,
  priority_keywords: [],
  key_contacts: []
}

// Helpers
function normalizeStyle(input?: DigestStyleInput): DigestStyleDb | undefined {
  if (!input) return undefined;
  const v = String(input).toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  switch (v) {
    case 'mission_brief':
    case 'mission':
    case 'bluf':
      return 'mission_brief';
    case 'management_consulting':
    case 'consulting':
    case 'mckinsey':
      return 'management_consulting';
    case 'startup_velocity':
    case 'startup':
    case 'velocity':
      return 'startup_velocity';
    case 'newsletter':
    case 'newspaper':
    case 'editorial':
      return 'newsletter';
    default:
      return undefined;
  }
}

type DigestStyleInput = 'mission-brief' | 'management-consulting' | 'startup-velocity' | 'newsletter' | string;
type DigestStyleDb = 'mission_brief' | 'management_consulting' | 'startup_velocity' | 'newsletter';
type Frequency = 'daily' | 'weekly' | 'weekdays' | 'custom';
type DeliveryMode = 'email' | 'slack' | 'audio';

export async function GET() {
  console.log('🔍 GET /api/user/preferences');
  
  try {
    const supabase = await createClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication error', details: authError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.warn('⚠️ Unauthorized: No user session');
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in' },
        { status: 401 }
      );
    }

    console.log(`🔑 Fetching preferences for user: ${user.id}`);
    
    // Fetch user preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('❌ Database error fetching preferences:', error);
      throw error;
    }

    // If no preferences exist, initialize with defaults
    if (!data) {
      console.log('ℹ️ No preferences found, initializing with defaults');
      const { data: newPrefs, error: insertError } = await supabase
        .from('user_preferences')
        .insert([{ 
          user_id: user.id, 
          preferences: DEFAULT_PREFERENCES,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('preferences')
        .single();

      if (insertError) {
        console.error('❌ Failed to initialize preferences:', insertError);
        throw insertError;
      }

      console.log('✅ Initialized default preferences');
      return NextResponse.json({ 
        preferences: newPrefs.preferences,
        isDefault: true
      });
    }

    console.log('✅ Retrieved user preferences');
    return NextResponse.json({ 
      preferences: data.preferences,
      isDefault: false
    });
    
  } catch (error: any) {
    console.error('❌ Server error in preferences endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process preferences request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('📝 POST /api/user/preferences');
  
  try {
    const supabase = await createClient();
    const updates = await request.json();
    
    console.log('📦 Received preference updates:', JSON.stringify(updates, null, 2));
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication error', details: authError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.warn('⚠️ Unauthorized: No user session');
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in' },
        { status: 401 }
      );
    }

    // Validate the updates object
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      console.error('❌ Invalid preferences data:', updates);
      return NextResponse.json(
        { 
          error: 'Invalid preferences data',
          details: 'Expected an object with preference values'
        },
        { status: 400 }
      );
    }

    // Get current preferences to merge with updates
    console.log(`🔍 Fetching current preferences for user: ${user.id}`);
    const { data: currentPrefs, error: fetchError } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Error fetching current preferences:', fetchError);
      throw fetchError;
    }

    // Use existing preferences or defaults
    const currentPreferences = currentPrefs?.preferences || { ...DEFAULT_PREFERENCES };
    console.log('🔄 Current preferences:', JSON.stringify(currentPreferences, null, 2));

    // Validate and normalize updates
    const normalizedUpdates = { ...updates };
    
    // Normalize style if provided
    if (updates.digest_style) {
      const normalizedStyle = normalizeStyle(updates.digest_style);
      if (normalizedStyle) {
        normalizedUpdates.digest_style = normalizedStyle;
      } else {
        console.warn(`⚠️ Invalid digest style: ${updates.digest_style}, using current value`);
        delete normalizedUpdates.digest_style;
      }
    }
    
    // Ensure arrays are properly set
    const arrayFields = ['priority_keywords', 'key_contacts'];
    arrayFields.forEach(field => {
      if (field in normalizedUpdates && !Array.isArray(normalizedUpdates[field])) {
        console.warn(`⚠️ ${field} must be an array, using current value`);
        delete normalizedUpdates[field];
      }
    });
    
    // Merge updates with current preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...normalizedUpdates,
      updated_at: new Date().toISOString()
    };
    
    console.log('🔄 Updated preferences:', JSON.stringify(updatedPreferences, null, 2));

    // Remove internal fields that shouldn't be in preferences
    const { id, user_id, created_at, updated_at, ...cleanPreferences } = updatedPreferences;

    // Update or insert the preferences
    console.log('💾 Saving preferences to database...');
    
    // Prepare the data to upsert
    const upsertData = {
      user_id: user.id,
      preferences: cleanPreferences,
      updated_at: new Date().toISOString(),
      ...(currentPrefs ? {} : { created_at: new Date().toISOString() })
    };
    
    // For updates, we need to use a transaction to ensure consistency
    const { data, error } = await (async () => {
      if (currentPrefs) {
        // Update existing
        return await supabase
          .from('user_preferences')
          .update(upsertData)
          .eq('user_id', user.id)
          .select('preferences')
          .single();
      } else {
        // Insert new
        return await supabase
          .from('user_preferences')
          .insert(upsertData)
          .select('preferences')
          .single();
      }
    })();

    if (error) {
      console.error('❌ Error saving preferences:', error);
      throw error;
    }

    console.log('✅ Preferences saved successfully');
    return NextResponse.json({ 
      success: true, 
      preferences: data.preferences 
    })
  } catch (error: any) {
    console.error('❌ Server error in preferences POST endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update preferences',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

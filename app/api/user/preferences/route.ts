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
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Fetch user preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // If no preferences exist, return default values
      if (error.code === 'PGRST116') {
        // Insert default preferences
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert([{
            user_id: user.id,
            ...DEFAULT_PREFERENCES
          }])
          .select()
          .single()

        if (insertError) {
          console.error('Error creating default preferences:', insertError)
          throw insertError
        }

        // Return the inserted preferences
        const { id, user_id, created_at, updated_at, ...prefs } = newPrefs
        return NextResponse.json(prefs)
      }
      
      console.error('Error fetching preferences:', error)
      throw error
    }

    // Remove internal fields before returning
    const { id, user_id, created_at, updated_at, ...prefs } = preferences
    return NextResponse.json(prefs)
  } catch (error) {
    console.error('Error in GET /api/user/preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const updates = await request.json()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Validate the updates object
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences data' },
        { status: 400 }
      )
    }

    // Get current preferences to merge with updates
    const { data: currentPrefs, error: fetchError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If no existing prefs, use defaults
    const currentPreferences = fetchError?.code === 'PGRST116' 
      ? { ...DEFAULT_PREFERENCES }
      : currentPrefs || { ...DEFAULT_PREFERENCES }

    // Normalize style input to DB-safe value if provided
    const normalizedStyle = normalizeStyle(updates.digest_style);

    // Merge updates with current preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...updates,
      ...(normalizedStyle ? { digest_style: normalizedStyle } : {}),
      // Ensure arrays are properly set
      priority_keywords: Array.isArray(updates.priority_keywords) 
        ? updates.priority_keywords 
        : currentPreferences.priority_keywords || [],
      key_contacts: Array.isArray(updates.key_contacts) 
        ? updates.key_contacts 
        : currentPreferences.key_contacts || []
    }

    // Remove internal fields
    delete updatedPreferences.id
    delete updatedPreferences.user_id
    delete updatedPreferences.created_at
    delete updatedPreferences.updated_at

    // Update or insert the preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...updatedPreferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving preferences:', error)
      throw error
    }

    // Remove internal fields before returning
    const { id, user_id: uid, created_at, updated_at, ...prefs } = data
    return NextResponse.json(prefs)
  } catch (error) {
    console.error('Error in POST /api/user/preferences:', error)
    return NextResponse.json(
      { error: 'Failed to save user preferences' },
      { status: 500 }
    )
  }
}

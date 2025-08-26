// @ts-nocheck
// First, load environment variables using our utility
import { env } from './load-env';

// Now we can safely import other modules that depend on environment variables
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database.types';
import { createDigestSchedule, getDigestSchedules } from '@/lib/services/digestService';

// Create a direct Supabase client with service role for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helpful type alias for explicit payload typing
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

// Log environment status
console.log('Environment:');
console.log('- Supabase URL:', env.supabaseUrl ? '*** (set)' : '❌ NOT SET');
console.log('- Supabase client initialized:', !!supabase);

if (!env.supabaseUrl || !env.supabaseAnonKey) {
  console.error('❌ Missing required Supabase environment variables');
  process.exit(1);
}

// A valid UUID for testing purposes
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

// Helper function to create a test user if it doesn't exist
async function ensureTestUser() {
  // Check if test user exists in auth.users
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(TEST_USER_ID);
  
  if (authError && authError.status !== 404) {
    console.error('Error checking for test user:', authError);
    throw authError;
  }
  
  // If user doesn't exist, create a test user (this requires service role key)
  if (!authUser?.user) {
    console.log('Creating test user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      id: TEST_USER_ID,
      email: `test-${TEST_USER_ID}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    });
    
    if (createError) {
      console.error('Error creating test user:', createError);
      throw createError;
    }
    
    console.log('✅ Created test user:', newUser.user.id);
  } else {
    console.log('✅ Test user exists:', authUser.user.id);
  }
  
  // Ensure the user has a profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert<ProfileInsert>(
      {
        id: TEST_USER_ID,
        email: `test-${TEST_USER_ID}@example.com`,
        full_name: 'Test User',
        timezone: 'America/Chicago',
      },
      { onConflict: 'id' }
    )
    .select()
    .single();
    
  if (profileError) {
    console.error('Error ensuring user profile:', profileError);
    throw profileError;
  }
  
  console.log('✅ User profile ready:', profile.id);
  return profile;
}

async function testDigestSchedule() {
  try {
    // First, ensure test user exists
    await ensureTestUser();
    
    console.log('\nTesting digest schedule creation...');
    
    // Create a test digest schedule using direct DB access with service role
    const { data: newDigest, error: createError } = await supabase
      .from('digest_schedules')
      .insert({
        user_id: TEST_USER_ID,
        name: 'Morning Briefing',
        description: 'Daily morning update with emails and calendar',
        frequency: 'daily',
        time: '09:00',
        timezone: 'America/Chicago',
        include_emails: true,
        include_calendar: true,
        summary_length: 'brief'
      })
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating digest schedule:', createError);
      throw createError;
    }
    
    console.log('✅ Created digest schedule:', {
      id: newDigest.id,
      name: newDigest.name,
      frequency: newDigest.frequency,
      time: newDigest.time,
      userId: newDigest.userId
    });
    
    // Fetch all digest schedules for the test user using direct DB access
    console.log('\nFetching digest schedules...');
    const { data: digests, error: fetchError } = await supabase
      .from('digest_schedules')
      .select('*')
      .eq('user_id', TEST_USER_ID);
      
    if (fetchError) {
      console.error('Error fetching digest schedules:', fetchError);
      throw fetchError;
    }
    
    console.log('📋 Found', digests.length, 'digest schedules:');
    digests.forEach((digest, index) => {
      console.log(`  ${index + 1}. ${digest.name} (${digest.frequency} at ${digest.time})`);
    });
    
  } catch (error) {
    console.error('❌ Error testing digest schedule:');
    if (error instanceof Error) {
      console.error('  Message:', error.message);
      if ('code' in error) console.error('  Code:', error.code);
      if ('details' in error) console.error('  Details:', error.details);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

testDigestSchedule();

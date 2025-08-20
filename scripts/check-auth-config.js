require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthConfig() {
  try {
    console.log('Checking Supabase Auth configuration...');
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
    } else {
      console.log('Current session:', session ? 'Active' : 'No active session');
    }
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
    } else {
      console.log('Current user:', user ? user.email : 'No user logged in');
    }
    
    // Get the auth settings
    const { data: settings, error: settingsError } = await supabase
      .from('auth.settings')
      .select('*')
      .single();
    
    if (settingsError) {
      console.log('Could not fetch auth settings (this is normal for non-admin users)');
    } else {
      console.log('Auth settings:', settings);
    }
    
    // Check if we can fetch the auth config
    console.log('\nAuth Configuration:');
    console.log('Site URL:', process.env.NEXT_PUBLIC_URL || 'Not set');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Anon Key:', supabaseKey.slice(0, 10) + '...');
    
    // Check if we can make a simple query
    console.log('\nTesting database connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
    } else {
      console.log('Database connection successful!');
    }
    
  } catch (err) {
    console.error('Error checking auth config:', err);
  }
}

checkAuthConfig();

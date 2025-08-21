// Test Supabase client connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key:', supabaseKey ? '*** (present)' : 'MISSING');
    
    // Test a simple query
    const { data, error } = await supabase
      .from('profiles') // Replace with an actual table name in your database
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase query error:', error);
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('Error testing Supabase connection:', err);
  }
}

testConnection();

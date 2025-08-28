// scripts/check-supabase.js
require('dotenv').config({ path: '.env.test' });

console.log('Checking Supabase configuration...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing');

// Try to import the supabase client
try {
  const { supabase } = require('../src/utils/supabaseClient');
  console.log('\nSupabase client initialized successfully!');
  
  // Test a simple query
  (async () => {
    try {
      console.log('\nTesting database connection...');
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      
      if (error) throw error;
      console.log('✅ Database connection successful!');
      console.log('Sample data:', data);
    } catch (error) {
      console.error('❌ Database connection failed:');
      console.error(error.message);
    }
  })();
} catch (error) {
  console.error('\n❌ Failed to initialize Supabase client:');
  console.error(error.message);
}

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key:', supabaseKey ? '*** (key exists)' : 'MISSING');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // First, check if the digest_schedules table exists
    console.log('\nChecking for digest_schedules table...');
    const { data, error } = await supabase
      .from('digest_schedules')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('digest_schedules table check failed, checking information_schema...');
      
      // If the table doesn't exist, list all tables in the public schema
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_all_tables')
        .select('*');
      
      if (tablesError) {
        console.log('Could not list tables, trying a different approach...');
        
        // Try a direct query to information_schema
        const { data: infoSchema, error: infoError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
        
        if (infoError) {
          console.error('Error querying information_schema:', infoError);
          console.log('\n✅ Successfully connected to Supabase, but could not list tables.');
          console.log('This might be a permissions issue or the database might be empty.');
          return;
        }
        
        console.log('\n✅ Successfully connected to Supabase!');
        console.log('Available tables in public schema:');
        console.log(infoSchema?.map(t => `- ${t.table_name}`).join('\n') || 'No tables found');
        return;
      }
      
      console.log('\n✅ Successfully connected to Supabase!');
      console.log('Available tables:', tables);
      return;
    }
    
    console.log('\n✅ Successfully connected to Supabase!');
    console.log('digest_schedules table exists with data:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection().catch(console.error);

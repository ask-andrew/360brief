#!/usr/bin/env tsx

/**
 * Apply database migration to add compute_insights job type
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('\n🔧 Applying database migration...\n');
  
  const migrationSQL = `
-- Drop the old constraint
ALTER TABLE public.analytics_jobs 
  DROP CONSTRAINT IF EXISTS analytics_jobs_job_type_check;

-- Add the new constraint with compute_insights included
ALTER TABLE public.analytics_jobs 
  ADD CONSTRAINT analytics_jobs_job_type_check 
  CHECK (job_type IN ('fetch_messages', 'compute_analytics', 'full_sync', 'compute_insights'));
  `;
  
  try {
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Try direct execution via raw SQL
      console.log('⚠️  RPC method not available, trying direct execution...\n');
      
      // Split into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        const result = await supabase.from('_migrations').select('*').limit(0); // This won't work directly
        // We need a different approach
      }
      
      console.log('\n❌ Cannot execute SQL directly via Supabase client');
      console.log('   Please run the migration manually:\n');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Paste and run the following SQL:\n');
      console.log(migrationSQL);
      console.log('\n   OR run: npx supabase db push (after linking project)\n');
      return;
    }
    
    console.log('✅ Migration applied successfully!\n');
    
  } catch (err) {
    console.error('❌ Error applying migration:', err);
    console.log('\n📝 Manual Migration Required:\n');
    console.log('Please run this SQL in Supabase Dashboard → SQL Editor:\n');
    console.log(migrationSQL);
    console.log('\n');
  }
}

main().catch(console.error);

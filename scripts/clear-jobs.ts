#!/usr/bin/env tsx

/**
 * Clear Analytics Jobs
 * 
 * Deletes all jobs from the analytics_jobs table so we can test with a fresh job
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function clearJobs() {
  console.log('\n🗑️  Clearing all analytics jobs...\n');

  const { data, error } = await supabase
    .from('analytics_jobs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (error) {
    console.error('❌ Error clearing jobs:', error);
    process.exit(1);
  }

  console.log('✅ All analytics jobs cleared!');
  console.log('📊 Now refresh your browser to create a fresh job\n');
}

clearJobs()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });

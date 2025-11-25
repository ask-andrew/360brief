/**
 * Test Analytics Infrastructure - Real User Version
 * Verifies that the migration was applied successfully using actual user
 * 
 * Run with: node scripts/test-analytics-real.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testSetup() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING ANALYTICS INFRASTRUCTURE');
  console.log('='.repeat(70) + '\n');

  let allPassed = true;

  // Test 1: Check if tables exist
  console.log('Test 1: Verifying database tables...\n');
  
  const tables = [
    { name: 'analytics_jobs', description: 'Background job tracking' },
    { name: 'message_cache', description: 'Gmail message cache' },
    { name: 'analytics_cache', description: 'Computed analytics cache' }
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table.name)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ Table '${table.name}' - ${error.message}`);
      allPassed = false;
    } else {
      console.log(`  ✅ Table '${table.name}' - ${table.description}`);
    }
  }

  // Get a real user from the database
  console.log('\n\nTest 2: Finding a real user for testing...\n');
  
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, email')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.log('  ⚠️  No users found in database. Skipping user-specific tests.');
    console.log('  💡 This is OK - tables are verified and ready to use!');
  } else {
    const testUser = users[0];
    console.log(`  ✅ Using user: ${testUser.email} (${testUser.id})`);

    // Test 3: Create a test job
    console.log('\n\nTest 3: Creating test analytics job...\n');
    
    const { data: job, error: jobError } = await supabase
      .from('analytics_jobs')
      .insert({
        user_id: testUser.id,
        job_type: 'fetch_messages',
        status: 'pending',
        progress: 0,
        total: 100,
        metadata: { days_back: 7, test: true }
      })
      .select()
      .single();

    if (jobError) {
      console.log(`  ❌ Failed to create job - ${jobError.message}`);
      allPassed = false;
    } else {
      console.log(`  ✅ Job created successfully`);
      console.log(`     Job ID: ${job.id}`);
      console.log(`     Status: ${job.status}`);
      console.log(`     Type: ${job.job_type}`);

      // Test 4: Update job progress
      console.log('\n\nTest 4: Updating job progress...\n');
      
      const { data: updatedJob, error: updateError } = await supabase
        .from('analytics_jobs')
        .update({
          status: 'processing',
          progress: 50,
          metadata: { ...job.metadata, current_step: 'Fetching messages...' }
        })
        .eq('id', job.id)
        .select()
        .single();

      if (updateError) {
        console.log(`  ❌ Failed to update job - ${updateError.message}`);
        allPassed = false;
      } else {
        console.log(`  ✅ Job updated successfully`);
        console.log(`     Status: ${updatedJob.status}`);
        console.log(`     Progress: ${updatedJob.progress}/${updatedJob.total}`);
      }

      // Test 5: Complete the job
      console.log('\n\nTest 5: Completing job...\n');
      
      const { data: completedJob, error: completeError } = await supabase
        .from('analytics_jobs')
        .update({
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)
        .select()
        .single();

      if (completeError) {
        console.log(`  ❌ Failed to complete job - ${completeError.message}`);
        allPassed = false;
      } else {
        console.log(`  ✅ Job completed successfully`);
        console.log(`     Final status: ${completedJob.status}`);
      }

      // Test 6: Cache a test message
      console.log('\n\nTest 6: Caching test message...\n');
      
      const { data: cachedMsg, error: cacheError } = await supabase
        .from('message_cache')
        .insert({
          user_id: testUser.id,
          message_id: `test-msg-${Date.now()}`,
          provider: 'gmail',
          raw_data: { subject: 'Test Message', from: 'test@example.com' },
          subject: 'Test Message',
          from_email: 'test@example.com',
          has_attachments: false
        })
        .select()
        .single();

      if (cacheError) {
        console.log(`  ❌ Failed to cache message - ${cacheError.message}`);
        allPassed = false;
      } else {
        console.log(`  ✅ Message cached successfully`);
        console.log(`     Message ID: ${cachedMsg.message_id}`);
        console.log(`     Subject: ${cachedMsg.subject}`);
      }

      // Test 7: Store analytics cache
      console.log('\n\nTest 7: Storing analytics cache...\n');
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes from now
      
      const { data: analyticsCache, error: analyticsCacheError } = await supabase
        .from('analytics_cache')
        .insert({
          user_id: testUser.id,
          cache_key: `analytics:test-${Date.now()}`,
          data: { total_count: 42, test: true },
          expires_at: expiresAt.toISOString(),
          hit_count: 0
        })
        .select()
        .single();

      if (analyticsCacheError) {
        console.log(`  ❌ Failed to store analytics cache - ${analyticsCacheError.message}`);
        allPassed = false;
      } else {
        console.log(`  ✅ Analytics cache stored successfully`);
        console.log(`     Cache key: ${analyticsCache.cache_key}`);
        console.log(`     Expires at: ${analyticsCache.expires_at}`);
      }

      // Cleanup: Delete test data
      console.log('\n\nCleaning up test data...\n');
      
      await supabase.from('analytics_jobs').delete().eq('id', job.id);
      await supabase.from('message_cache').delete().eq('message_id', cachedMsg.message_id);
      await supabase.from('analytics_cache').delete().eq('id', analyticsCache.id);
      
      console.log('  ✅ Test data cleaned up');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n🎉 Your analytics infrastructure is ready to use!');
    console.log('\n📋 What you can do now:');
    console.log('  1. Test the API endpoint (see command below)');
    console.log('  2. Check the service files are working');
    console.log('  3. Start implementing the background worker');
    console.log('\n💡 Test the API:');
    console.log('  curl -X POST http://localhost:3000/api/analytics/jobs \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"job_type": "fetch_messages", "metadata": {"days_back": 7}}\'');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('\nPlease check the errors above.');
  }
  console.log('='.repeat(70) + '\n');

  return allPassed;
}

// Run tests
testSetup()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

// Quick script to check if we have real data in the database
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkData() {
  console.log('🔍 Checking for real data in database...\n');
  
  // Check message cache
  const { data: messages, error: msgError } = await supabase
    .from('message_cache')
    .select('id, user_id, subject, internal_date')
    .limit(5);
  
  if (msgError) {
    console.error('❌ Error fetching messages:', msgError);
  } else {
    console.log(`📧 Messages in cache: ${messages?.length || 0}`);
    if (messages && messages.length > 0) {
      console.log('Sample message:', messages[0]);
    }
  }
  
  // Check analytics insights
  const { data: insights, error: insightError } = await supabase
    .from('analytics_insights')
    .select('id, user_id, insight_type, value, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (insightError) {
    console.error('❌ Error fetching insights:', insightError);
  } else {
    console.log(`\n🧠 Insights computed: ${insights?.length || 0}`);
    if (insights && insights.length > 0) {
      insights.forEach(i => {
        console.log(`  - ${i.insight_type}: ${JSON.stringify(i.value)}`);
      });
    }
  }
  
  // Check jobs
  const { data: jobs, error: jobError } = await supabase
    .from('analytics_jobs')
    .select('id, user_id, job_type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (jobError) {
    console.error('❌ Error fetching jobs:', jobError);
  } else {
    console.log(`\n⚙️ Recent jobs: ${jobs?.length || 0}`);
    if (jobs && jobs.length > 0) {
      jobs.forEach(j => {
        console.log(`  - ${j.job_type} (${j.status}) - ${new Date(j.created_at).toLocaleString()}`);
      });
    }
  }
}

checkData().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

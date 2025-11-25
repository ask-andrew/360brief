// src/services/analytics/insightService.ts
import { createClient } from '@supabase/supabase-js';
import type { MessageCacheEntry } from '@/types/analytics-jobs';

/**
 * Compute the Strategic vs Reactive Time Ratio insight for a user.
 * This simple implementation classifies a message as "strategic" if its subject
 * contains any of the strategicKeywords. It then measures the time gaps between
 * consecutive messages to estimate how much time is spent in strategic vs reactive
 * communication.
 *
 * The result is stored in the `analytics_insights` table (created via migration).
 */
export async function computeStrategicVsReactive(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Load cached messages for the user (limit to a reasonable number for demo)
  const { data: messages, error } = await supabase
    .from('message_cache')
    .select('internal_date, subject')
    .eq('user_id', userId)
    .order('internal_date', { ascending: true });

  if (error) {
    console.error('❌ Error fetching cached messages for insights:', error);
    throw new Error('Failed to fetch messages for insight');
  }

  if (!messages || messages.length < 2) {
    console.warn('⚠️ Not enough messages to compute insight');
    return;
  }

  const strategicKeywords = ['plan', 'strategy', 'proposal', 'roadmap', 'vision'];

  let strategicTime = 0;
  let reactiveTime = 0;

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1] as { internal_date: string; subject: string };
    const cur = messages[i] as { internal_date: string; subject: string };
    const diffSec =
      (new Date(cur.internal_date).getTime() - new Date(prev.internal_date).getTime()) / 1000;

    const isStrategic = strategicKeywords.some((kw) =>
      (cur.subject ?? '').toLowerCase().includes(kw)
    );
    if (isStrategic) strategicTime += diffSec;
    else reactiveTime += diffSec;
  }

  const total = strategicTime + reactiveTime;
  const ratio = total > 0 ? strategicTime / total : 0;

  // Store the insight
  const { error: insertError } = await supabase.from('analytics_insights').insert({
    user_id: userId,
    insight_type: 'strategic_vs_reactive',
    value: {
      ratio,
      strategic_seconds: strategicTime,
      reactive_seconds: reactiveTime,
    },
  });

  if (insertError) {
    console.error('❌ Error inserting insight:', insertError);
    throw new Error('Failed to store insight');
  }

  console.log(`✅ Insight computed for user ${userId}: ${Math.round(ratio * 100)}% strategic`);
}

/**
 * Compute Decision Velocity - measures average time from receiving a message to replying
 */
export async function computeDecisionVelocity(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: messages, error } = await supabase
    .from('message_cache')
    .select('internal_date, from_email, thread_id')
    .eq('user_id', userId)
    .order('internal_date', { ascending: true });

  if (error || !messages || messages.length < 2) {
    console.warn('⚠️ Not enough messages for decision velocity');
    return;
  }

  // Group by thread and calculate response times
  const threads = new Map<string, Array<{ date: Date; from: string }>>();
  
  for (const msg of messages) {
    const threadId = (msg as { thread_id?: string }).thread_id || 'unknown';
    if (!threads.has(threadId)) {
      threads.set(threadId, []);
    }
    threads.get(threadId)!.push({
      date: new Date((msg as { internal_date: string }).internal_date),
      from: (msg as { from_email?: string }).from_email || '',
    });
  }

  let totalResponseTime = 0;
  let responseCount = 0;

  for (const [, threadMessages] of threads) {
    if (threadMessages.length < 2) continue;
    
    for (let i = 1; i < threadMessages.length; i++) {
      const timeDiff = threadMessages[i].date.getTime() - threadMessages[i - 1].date.getTime();
      const hours = timeDiff / (1000 * 60 * 60);
      
      if (hours > 0 && hours < 168) { // Within a week
        totalResponseTime += hours;
        responseCount++;
      }
    }
  }

  const avgResponseHours = responseCount > 0 ? totalResponseTime / responseCount : 0;
  const velocityScore = Math.max(0, Math.min(100, 100 - (avgResponseHours / 24) * 10)); // Higher score = faster

  await supabase.from('analytics_insights').insert({
    user_id: userId,
    insight_type: 'decision_velocity',
    value: {
      avg_response_hours: avgResponseHours,
      velocity_score: velocityScore,
      total_responses: responseCount,
    },
  });

  console.log(`✅ Decision velocity computed: ${velocityScore.toFixed(1)} score (${avgResponseHours.toFixed(1)}h avg)`);
}

/**
 * Compute Relationship Health - tracks reciprocal communication patterns
 */
export async function computeRelationshipHealth(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: messages, error } = await supabase
    .from('message_cache')
    .select('from_email, to_emails, thread_id')
    .eq('user_id', userId);

  if (error || !messages || messages.length < 5) {
    console.warn('⚠️ Not enough messages for relationship health');
    return;
  }

  // Track reciprocal conversations
  const relationships = new Map<string, { sent: number; received: number }>();
  
  for (const msg of messages) {
    const from = (msg as { from_email?: string }).from_email || '';
    const toEmails = (msg as { to_emails?: string[] }).to_emails || [];
    
    for (const to of toEmails) {
      if (!relationships.has(to)) {
        relationships.set(to, { sent: 0, received: 0 });
      }
      relationships.get(to)!.sent++;
    }
    
    if (!relationships.has(from)) {
      relationships.set(from, { sent: 0, received: 0 });
    }
    relationships.get(from)!.received++;
  }

  // Calculate health scores
  const healthyRelationships = Array.from(relationships.entries())
    .filter(([_, stats]) => stats.sent > 0 && stats.received > 0)
    .map(([email, stats]) => ({
      email,
      balance: Math.min(stats.sent, stats.received) / Math.max(stats.sent, stats.received),
      total_interactions: stats.sent + stats.received,
    }))
    .sort((a, b) => b.total_interactions - a.total_interactions)
    .slice(0, 10);

  const avgBalance = healthyRelationships.length > 0
    ? healthyRelationships.reduce((sum, r) => sum + r.balance, 0) / healthyRelationships.length
    : 0;

  const healthScore = Math.round(avgBalance * 100);

  await supabase.from('analytics_insights').insert({
    user_id: userId,
    insight_type: 'relationship_health',
    value: {
      health_score: healthScore,
      top_relationships: healthyRelationships,
      total_contacts: relationships.size,
    },
  });

  console.log(`✅ Relationship health computed: ${healthScore} score, ${healthyRelationships.length} healthy relationships`);
}

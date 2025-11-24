#!/usr/bin/env tsx

/**
 * Check Gmail Connection Status
 * 
 * Shows which users have Gmail connected and ready for the worker
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkGmailConnections() {
  console.log('\n' + '='.repeat(70));
  console.log('📧 GMAIL CONNECTION STATUS');
  console.log('='.repeat(70) + '\n');

  // Get all users
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, email, full_name');

  if (userError || !users) {
    console.error('❌ Error fetching users:', userError);
    return;
  }

  console.log(`Found ${users.length} total user(s)\n`);

  // Check Gmail tokens for each user
  for (const user of users) {
    const { data: token, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    const hasGmail = !tokenError && token;
    const status = hasGmail ? '✅ Connected' : '❌ Not Connected';
    
    console.log(`${status}  ${user.email || 'No email'}`);
    
    if (hasGmail) {
      console.log(`           User ID: ${user.id}`);
      console.log(`           Access Token: ${token.access_token ? 'Present' : 'Missing'}`);
      console.log(`           Refresh Token: ${token.refresh_token ? 'Present' : 'Missing'}`);
      
      if (token.expires_at) {
        const expiresAt = new Date(token.expires_at);
        const isExpired = expiresAt < new Date();
        console.log(`           Expires: ${expiresAt.toLocaleString()} ${isExpired ? '(EXPIRED)' : '(Valid)'}`);
      }
    }
    console.log();
  }

  // Summary
  const connectedCount = users.filter(async (user) => {
    const { data } = await supabase
      .from('user_tokens')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();
    return !!data;
  }).length;

  console.log('='.repeat(70));
  console.log(`📊 Summary: ${connectedCount}/${users.length} users have Gmail connected`);
  console.log('='.repeat(70) + '\n');

  if (connectedCount === 0) {
    console.log('💡 To connect Gmail:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Sign in with your account');
    console.log('   3. Click "Connect Gmail" or "Connect Email"');
    console.log('   4. Complete the Google OAuth flow');
    console.log('   5. Run this script again to verify\n');
  }
}

checkGmailConnections()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });

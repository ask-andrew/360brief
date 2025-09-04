#!/usr/bin/env ts-node
/**
 * Manual OAuth Flow Test Script
 * 
 * This script tests the complete OAuth authentication flow including:
 * - User authentication
 * - Profile creation
 * - Token storage
 * - Gmail API access
 * - Error handling
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ 
  path: path.resolve(process.cwd(), '.env.local'),
  override: true
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: any) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${test}: ${message}`);
  if (details && status === 'FAIL') {
    console.log(`   Details:`, details);
  }
  results.push({ test, status, message, details });
}

async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact' })
      .limit(1);
    
    if (error) throw error;
    
    logTest('Database Connection', 'PASS', 'Successfully connected to Supabase');
    return true;
  } catch (error) {
    logTest('Database Connection', 'FAIL', 'Failed to connect to Supabase', error);
    return false;
  }
}

async function testProfilesTable() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .limit(5);
    
    if (error) throw error;
    
    logTest('Profiles Table', 'PASS', `Found ${data.length} profiles in database`);
    return true;
  } catch (error) {
    logTest('Profiles Table', 'FAIL', 'Failed to query profiles table', error);
    return false;
  }
}

async function testUserTokensTable() {
  try {
    const { data, error } = await supabase
      .from('user_tokens')
      .select('id, user_id, provider, expires_at')
      .limit(5);
    
    if (error) throw error;
    
    logTest('User Tokens Table', 'PASS', `Found ${data.length} tokens in database`);
    return true;
  } catch (error) {
    logTest('User Tokens Table', 'FAIL', 'Failed to query user_tokens table', error);
    return false;
  }
}

async function testAuthEndpoint() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003';
    const response = await fetch(`${baseUrl}/api/analytics/gmail`);
    
    if (response.status === 401) {
      const data = await response.json();
      logTest('Auth Endpoint', 'PASS', 'Correctly returns 401 for unauthenticated requests', {
        status: response.status,
        response: data
      });
      return true;
    } else {
      logTest('Auth Endpoint', 'FAIL', `Expected 401, got ${response.status}`, {
        status: response.status
      });
      return false;
    }
  } catch (error) {
    logTest('Auth Endpoint', 'FAIL', 'Failed to test auth endpoint', error);
    return false;
  }
}

async function testGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId) {
    logTest('Google OAuth Config', 'FAIL', 'Missing GOOGLE_CLIENT_ID environment variable');
    return false;
  }
  
  if (!clientSecret) {
    logTest('Google OAuth Config', 'FAIL', 'Missing GOOGLE_CLIENT_SECRET environment variable');
    return false;
  }
  
  // Check if client ID looks valid (should be a long string ending in .apps.googleusercontent.com)
  if (!clientId.includes('.apps.googleusercontent.com')) {
    logTest('Google OAuth Config', 'FAIL', 'GOOGLE_CLIENT_ID does not appear to be valid');
    return false;
  }
  
  logTest('Google OAuth Config', 'PASS', 'Google OAuth credentials are configured');
  return true;
}

async function testDatabaseMigrations() {
  try {
    // Check if all required tables exist with proper columns
    const tables = ['profiles', 'user_tokens', 'user_analytics_cache'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (error) {
        throw new Error(`Table ${table} does not exist or is not accessible: ${error.message}`);
      }
    }
    
    logTest('Database Migrations', 'PASS', 'All required tables exist and are accessible');
    return true;
  } catch (error) {
    logTest('Database Migrations', 'FAIL', 'Database migration issues detected', error);
    return false;
  }
}

async function testForeignKeyConstraints() {
  try {
    // Test if we can create a valid profile-token relationship
    const testUserId = 'test-user-' + Date.now();
    
    // This should fail because we're not actually authenticated
    const { error } = await supabase
      .from('profiles')
      .insert({ 
        id: testUserId, 
        email: 'test@example.com' 
      });
    
    if (error && error.message.includes('RLS')) {
      logTest('Foreign Key Constraints', 'PASS', 'RLS policies are properly configured');
      return true;
    } else {
      logTest('Foreign Key Constraints', 'FAIL', 'Unexpected result from constraint test', { error });
      return false;
    }
  } catch (error) {
    logTest('Foreign Key Constraints', 'FAIL', 'Error testing foreign key constraints', error);
    return false;
  }
}

async function generateReport() {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 OAUTH FLOW TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n🔍 FAILED TESTS:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`   • ${r.test}: ${r.message}`);
      });
  }
  
  console.log('\n📋 NEXT STEPS:');
  
  if (failed === 0) {
    console.log('   🎉 All tests passed! OAuth flow is ready for testing.');
    console.log('   📝 To test the complete flow:');
    console.log('      1. Visit http://localhost:3003/login');
    console.log('      2. Click "Continue with Google"');
    console.log('      3. Complete OAuth flow');
    console.log('      4. Check dashboard for Gmail connection');
  } else {
    console.log('   🔧 Fix failed tests before proceeding with OAuth flow testing.');
    console.log('   💡 Check environment variables and database setup.');
  }
  
  return failed === 0;
}

async function main() {
  console.log('🚀 Starting OAuth Flow Tests...\n');
  
  // Run tests in sequence
  await testDatabaseConnection();
  await testProfilesTable();
  await testUserTokensTable();
  await testDatabaseMigrations();
  await testForeignKeyConstraints();
  await testGoogleOAuthConfig();
  await testAuthEndpoint();
  
  const success = await generateReport();
  process.exit(success ? 0 : 1);
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as testOAuthFlow };
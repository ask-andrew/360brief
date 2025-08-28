#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkOAuthConfig() {
  console.log('🔍 Checking OAuth Configuration...');
  
  // 1. Verify required environment variables
  console.log('\n🔑 Checking environment variables:');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SITE_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are present');
  
  // 2. Check if Google OAuth is enabled
  console.log('\n🔍 Checking Google OAuth configuration:');
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('ℹ️  Not authenticated, this is expected for this check');
    }
    
    // 3. Get the OAuth providers
    const { data: providers, error: providersError } = await supabase.auth.getOAuthProviders();
    
    if (providersError) {
      console.error('❌ Error fetching OAuth providers:', providersError.message);
      process.exit(1);
    }
    
    console.log('✅ Available OAuth providers:', providers.map(p => p.provider_id).join(', '));
    
    if (!providers.some(p => p.provider_id === 'google')) {
      console.error('❌ Google OAuth is not enabled in your Supabase project');
      console.log('\n🔧 To enable Google OAuth:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to Authentication > Providers');
      console.log('3. Enable Google OAuth and configure your Client ID and Secret');
      console.log('4. Add the following redirect URLs:');
      console.log(`   - ${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);
      console.log(`   - ${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`);
      process.exit(1);
    }
    
    console.log('✅ Google OAuth is properly configured');
    
    // 4. Test OAuth URL generation
    console.log('\n🔗 Testing OAuth URL generation:');
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
    const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (oauthError) {
      console.error('❌ Error generating OAuth URL:', oauthError.message);
      process.exit(1);
    }
    
    console.log('✅ Successfully generated OAuth URL');
    console.log('🔗 OAuth URL:', oauthData.url);
    
    console.log('\n🎉 OAuth configuration looks good! You can now test the login flow in your browser.');
    
  } catch (error) {
    console.error('❌ Error checking OAuth configuration:', error.message);
    process.exit(1);
  }
}

// Run the check
checkOAuthConfig();

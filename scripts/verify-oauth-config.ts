import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function checkOAuthConfig() {
  console.log('🔍 Checking OAuth Configuration...');
  
  // 1. Verify required environment variables
  console.log('\n🔑 Checking environment variables:');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SITE_URL'
  ] as const;
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are present');
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // 2. Check if Google OAuth is enabled
  console.log('\n🔍 Checking Google OAuth configuration:');
  
  try {
    // 3. Check if Google OAuth is configured by attempting to generate a sign-in URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    
    if (error) {
      if (error.message.includes('Provider not supported')) {
        console.error('❌ Google OAuth is not enabled in your Supabase project');
        console.log('\n🔧 To enable Google OAuth:');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to Authentication > Providers');
        console.log('3. Enable Google OAuth and configure your Client ID and Secret');
        console.log('4. Add the following redirect URLs:');
        console.log(`   - ${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);
        console.log(`   - ${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`);
      } else {
        console.error('❌ Error checking OAuth configuration:', error.message);
      }
      process.exit(1);
    }
    
    console.log('✅ Google OAuth is properly configured');
    console.log('🔗 OAuth URL:', data.url);
    
    // List of common providers (for display purposes only)
    const commonProviders = ['google', 'github', 'gitlab', 'azure', 'discord'];
    console.log('ℹ️  Common OAuth providers:', commonProviders.join(', '));
    
    console.log('\n🎉 OAuth configuration looks good! You can now test the login flow in your browser.');
    console.log('\n🔗 Test the login flow by visiting:', `${process.env.NEXT_PUBLIC_SITE_URL}/login`);
    
  } catch (error) {
    console.error('❌ Error checking OAuth configuration:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the check
checkOAuthConfig();

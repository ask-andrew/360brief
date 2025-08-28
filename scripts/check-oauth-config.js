require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkOAuthConfig() {
  try {
    console.log('Checking OAuth configuration...');
    
    // Get the auth providers
    const { data: providers, error: providersError } = await supabase.auth.admin.listProviders();
    
    if (providersError) {
      console.error('Error getting providers:', providersError);
    } else {
      console.log('Enabled providers:', providers);
    }
    
    // Get the site URL configuration
    const { data: siteUrlData, error: siteUrlError } = await supabase
      .from('auth.sites')
      .select('*')
      .single();
    
    if (siteUrlError) {
      console.error('Error getting site URL:', siteUrlError);
    } else {
      console.log('Site URL configuration:', siteUrlData);
    }
    
    // Check if Google OAuth is configured
    const { data: googleConfig, error: googleConfigError } = await supabase
      .from('auth.providers')
      .select('*')
      .eq('provider_id', 'google')
      .single();
    
    if (googleConfigError) {
      console.error('Error getting Google OAuth config:', googleConfigError);
    } else {
      console.log('Google OAuth configuration:', googleConfig);
    }
    
    // Check redirect URLs
    const { data: redirectUrls, error: redirectError } = await supabase
      .from('auth.redirect_urls')
      .select('*');
    
    if (redirectError) {
      console.error('Error getting redirect URLs:', redirectError);
    } else {
      console.log('Configured redirect URLs:', redirectUrls);
    }
    
  } catch (error) {
    console.error('Error checking OAuth configuration:', error);
  }
}

checkOAuthConfig();

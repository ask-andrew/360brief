// This file ensures environment variables are properly exposed to the client

// Client-side environment variables must be prefixed with NEXT_PUBLIC_
// These values will be embedded in the client-side bundle

const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

// Validate required environment variables
if (typeof window !== 'undefined') { // Only run this validation in the browser
  const missingVars = [];
  
  if (!config.supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!config.supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
  }
}

export default config;

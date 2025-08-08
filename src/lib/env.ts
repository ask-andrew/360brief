// This file provides a consistent way to access environment variables
// across both the application and scripts

// For client-side code
const clientEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

// For server-side/script code
const serverEnv = {
  ...clientEnv,
  // Add any server-only environment variables here
};

// Type-safe environment variables
type Env = typeof clientEnv & typeof serverEnv;

// Export the appropriate environment based on the context
const env: Env = typeof window === 'undefined' 
  ? { ...clientEnv, ...serverEnv } 
  : clientEnv;

export default env;

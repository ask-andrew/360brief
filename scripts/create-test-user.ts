import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test
dotenv.config({ 
  path: path.resolve(process.cwd(), '.env.test'),
  override: true
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

// Create a regular Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  const email = process.env.TEST_USER_EMAIL || 'test@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'testpassword123';

  console.log('Setting up test user...');
  
  try {
    // First, try to sign in the user
    const { data: signInData, error: signInError } = 
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    let userId: string;

    if (signInError || !signInData.user) {
      console.log('Creating new test user...');
      
      // Try to sign up the user
      const { data: signUpData, error: signUpError } = 
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'http://localhost:3000/auth/callback',
            data: {
              full_name: 'Test User'
            }
          },
        });

      if (signUpError || !signUpData.user) {
        throw new Error(`Failed to create user: ${signUpError?.message || 'Unknown error'}`);
      }

      userId = signUpData.user.id;
      console.log('Test user created successfully');
    } else {
      userId = signInData.user.id;
      console.log('Test user already exists');
    }

    // Ensure user profile exists
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: 'Test User',
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.warn('Note: Could not update profile. This might be expected if RLS is enabled.');
      console.warn(`Profile error: ${profileError.message}`);
    }

    console.log('Test user setup completed successfully');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('You can now use these credentials for testing');
    
  } catch (error) {
    console.error('Error setting up test user:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

createTestUser().catch(console.error);

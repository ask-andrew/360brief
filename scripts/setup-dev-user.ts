import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Get command line arguments
const args = process.argv.slice(2);
const supabaseUrl = args[0] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = args[1] || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required parameters
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required parameters');
  console.log('\nUsage:');
  console.log('  npx ts-node scripts/setup-dev-user.ts <supabase-url> <service-role-key>');
  console.log('  or');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key npx ts-node scripts/setup-dev-user.ts');
  console.log('\nExample:');
  console.log('  npx ts-node scripts/setup-dev-user.ts https://your-project.supabase.co sbp_your_service_role_key');
  process.exit(1);
}

// Ensure URL has protocol
const validUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;

console.log('Connecting to Supabase...');
console.log(`- URL: ${validUrl}`);
console.log(`- Service Role Key: ${supabaseServiceKey.substring(0, 10)}...`);

// Create admin client with service role key
const supabase = createClient(validUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupDevUser() {
  const email = 'dev@360brief.local';
  const password = 'devpassword123';

  try {
    console.log('Setting up development user...');
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log('Development user already exists, updating password...');
      
      // Update password for existing user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: password }
      );

      if (updateError) throw updateError;
      console.log('Development user password updated successfully');
    } else {
      console.log('Creating new development user...');
      
      // Create new user
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          full_name: 'Development User',
          avatar_url: ''
        }
      });

      if (signUpError) throw signUpError;
      console.log('Development user created successfully');
    }

    console.log('Development user setup complete');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (error) {
    console.error('Error setting up development user:', error);
    process.exit(1);
  }
}

setupDevUser();

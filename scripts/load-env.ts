// This script ensures environment variables are loaded before any other imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the project root directory (go up two levels from scripts directory)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..'); // Go up one level to the project root

// Load environment variables from .env.local in the project root
const envPath = path.resolve(projectRoot, '.env.local');
console.log(`Loading environment variables from: ${envPath}`);
console.log(`Current working directory: ${process.cwd()}`);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  process.exit(1);
}

// Log loaded environment variables (safely)
console.log('Environment variables loaded successfully');
console.log('NEXT_PUBLIC_SUPABASE_URL:', 
  process.env.NEXT_PUBLIC_SUPABASE_URL ? '*** (set)' : '❌ NOT SET');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '*** (set)' : '❌ NOT SET');

// Re-export the environment variables
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

// Validate required environment variables
const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.log('Current working directory:', process.cwd());
  console.log('Project root directory:', projectRoot);
  console.log('Files in project root:', execSync('ls -la', { cwd: projectRoot }).toString());
  process.exit(1);
}

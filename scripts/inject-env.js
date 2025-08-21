const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Read the template file
const templatePath = path.resolve(__dirname, '../public/oauth-callback.template.html');
const outputPath = path.resolve(__dirname, '../public/oauth-callback.html');

// Get environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing required environment variables');
  process.exit(1);
}

// Read the template
let content = fs.readFileSync(templatePath, 'utf8');

// Replace placeholders
content = content
  .replace('{{SUPABASE_URL}}', SUPABASE_URL)
  .replace('{{SUPABASE_ANON_KEY}}', SUPABASE_ANON_KEY);

// Write the output file
fs.writeFileSync(outputPath, content, 'utf8');
console.log('Successfully generated oauth-callback.html with environment variables');

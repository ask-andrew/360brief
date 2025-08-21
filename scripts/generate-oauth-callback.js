const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing required environment variables NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const templatePath = path.join(__dirname, '../public/oauth-callback.template.html');
const outputPath = path.join(__dirname, '../public/oauth-callback.html');

// Read the template file
fs.readFile(templatePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading template file:', err);
    return;
  }

  // Replace the placeholders with actual values
  const result = data
    .replace(/\{\{https:\/\/cqejejllmbzzsvtbyuke\.supabase\.co\}\}/g, SUPABASE_URL)
    .replace(/\{\{[^}]*\}\}/g, SUPABASE_ANON_KEY);

  // Write the result to the output file
  fs.writeFile(outputPath, result, 'utf8', (err) => {
    if (err) {
      console.error('Error writing output file:', err);
      return;
    }
    console.log('Successfully generated oauth-callback.html');
  });
});

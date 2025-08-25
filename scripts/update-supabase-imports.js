const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'app/api/briefs/current/route.ts',
  'app/api/dev/login/route.ts',
  'app/api/digests/route.ts',
  'app/api/user/connected-accounts/[id]/route.ts',
  'app/api/user/connected-accounts/route.ts',
  'app/api/user/preferences/route.ts',
  'src/lib/gmail/oauth.ts',
  'src/lib/services/unifiedDataService.ts'
];

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace the import
    content = content.replace(
      /import\s+{\s*createServerSupabaseClient\s*}\s+from\s+['"]@\/lib\/supabase\/server['"]/g,
      'import { createClient } from \'@/lib/supabase/server\''
    );
    
    // Replace the usage
    content = content.replace(
      /createServerSupabaseClient\(/g,
      'createClient('
    );
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
    console.warn(`File not found: ${filePath}`);
  }
});

console.log('Update complete!');

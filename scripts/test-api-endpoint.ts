#!/usr/bin/env tsx

/**
 * Test the analytics API endpoints to see actual errors
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('\n🧪 Testing Analytics API Endpoints...\n');
  
  // Get user with valid token
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === 'andrew.ledet@gmail.com');
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log(`✅ Testing with user: ${user.email}\n`);
  
  // Get a session token
  const { data: session } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email!,
  });
  
  console.log('📊 Testing /api/analytics/from-job...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/analytics/from-job?daysBack=7', {
      headers: {
        'Authorization': `Bearer ${session.properties?.access_token || ''}`,
      },
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ API Response:');
      console.log(`   Total messages: ${data.total_count}`);
      console.log(`   Data source: ${data.dataSource}`);
      console.log(`   Has recent_trends: ${!!data.recent_trends}`);
      if (data.recent_trends) {
        console.log(`   Has recent_trends.messages: ${!!data.recent_trends.messages}`);
      }
      console.log(`   Has priority_messages: ${!!data.priority_messages}`);
      console.log(`   Has sentiment_analysis: ${!!data.sentiment_analysis}`);
      console.log(`   Has network_data: ${!!data.network_data}`);
      
      // Check for any undefined fields
      const checkUndefined = (obj: any, path = ''): string[] => {
        const issues: string[] = [];
        for (const [key, value] of Object.entries(obj)) {
          const fullPath = path ? `${path}.${key}` : key;
          if (value === undefined) {
            issues.push(fullPath);
          } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            issues.push(...checkUndefined(value, fullPath));
          }
        }
        return issues;
      };
      
      const undefinedFields = checkUndefined(data);
      if (undefinedFields.length > 0) {
        console.log('\n⚠️  Undefined fields found:');
        undefinedFields.forEach(field => console.log(`   - ${field}`));
      } else {
        console.log('\n✅ No undefined fields!');
      }
      
    } else {
      console.log('\n❌ API Error:');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Fetch error:', error);
  }
  
  console.log('\n');
}

main().catch(console.error);

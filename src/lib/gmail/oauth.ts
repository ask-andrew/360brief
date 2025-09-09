import { createClient } from '@/lib/supabase/server';
import { refreshAccessToken } from '@/server/google/client';
import { toDatabaseTimestamp, isDatabaseTimestampExpired, isTokenNearExpiry } from '@/lib/utils/timestamp';

// Force Node.js runtime for service role operations
export const runtime = 'nodejs';

// Returns a valid Google access token for the user's primary connected Google account.
// Requires to be called from a server context (Next.js route/loader) so cookies are available.
export async function getValidAccessToken(userId: string): Promise<string> {
  console.log(`🔍 getValidAccessToken called with userId: ${userId}`);
  const supabase = await createClient();
  
  // First try regular supabase client (should work for authenticated users)
  console.log(`🔍 Attempting token retrieval for user_id: '${userId}' using regular client`);
  
  let accounts: any[] | null = null;
  let error: any = null;
  
  // Try regular client first
  const { data: regularAccounts, error: regularError } = await supabase
    .from('user_tokens')
    .select('id, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .limit(1);

  if (regularError) {
    console.log(`⚠️ Regular client failed: ${regularError.message}, trying service role...`);
    
    // Fallback to service role client
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: serviceAccounts, error: serviceError } = await serviceSupabase
      .from('user_tokens')
      .select('id, access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .limit(1);
    
    accounts = serviceAccounts;
    error = serviceError;
  } else {
    console.log(`✅ Regular client succeeded, found ${regularAccounts?.length || 0} tokens`);
    accounts = regularAccounts;
    error = null;
  }

  if (error) {
    console.error(`❌ OAuth token query error for user ${userId}:`, error);
    throw error;
  }
  
  console.log(`🔍 Token query result for user ${userId}:`, { 
    count: accounts?.length, 
    hasTokens: !!accounts?.[0]?.access_token,
    expires_at: accounts?.[0]?.expires_at,
    fullRecord: accounts?.[0] ? { 
      id: accounts[0].id, 
      user_id: userId,
      provider: 'google',
      has_access_token: !!accounts[0].access_token,
      has_refresh_token: !!accounts[0].refresh_token
    } : null
  });
  
  // Also check if there are ANY tokens for this user (to debug potential provider mismatch)
  const { createClient: createDebugServiceClient } = await import('@supabase/supabase-js');
  const debugServiceSupabase = createDebugServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: allTokens, error: allError } = await debugServiceSupabase
    .from('user_tokens')
    .select('user_id, provider, expires_at')
    .eq('user_id', userId);
    
  console.log(`🔍 All tokens for user ${userId}:`, allTokens?.length || 0, allTokens);
  
  const acct = accounts?.[0];
  if (!acct) {
    console.log(`⚠️ No OAuth tokens found for user ${userId} in user_tokens table`);
    throw new Error('No connected Google account found for user');
  }
  
  console.log(`✅ Found OAuth tokens for user ${userId}, expires_at:`, acct.expires_at);

  // Use new database-compatible timestamp checking with proactive refresh buffer
  const isTokenExpired = isDatabaseTimestampExpired(acct.expires_at as string);
  const needsProactiveRefresh = isTokenNearExpiry(acct.expires_at as string, 10); // 10 minute buffer
  
  if (!!acct.access_token && !isTokenExpired && !needsProactiveRefresh) {
    console.log(`✅ Using valid access token (expires: ${acct.expires_at})`);
    return acct.access_token as string;
  }
  
  if (needsProactiveRefresh && !isTokenExpired) {
    console.log(`🔄 Token expiring soon, proactively refreshing (expires: ${acct.expires_at})`);
  } else {
    console.log(`🔄 Token expired or missing, attempting refresh (expires: ${acct.expires_at})`);
  }

  if (!acct.refresh_token) throw new Error('Missing Google refresh token; reconnect your account');

  // Refresh using Google OAuth client with improved error handling
  try {
    const creds = await refreshAccessToken(acct.refresh_token);
    const newAccess = creds.access_token as string;
    const newExpiryMs = creds.expiry_date as number | undefined;
    const newRefresh = creds.refresh_token as string | undefined;

    if (!newAccess) throw new Error('Failed to refresh Google access token');

    console.log(`✅ Token refresh successful, new expiry: ${newExpiryMs ? new Date(newExpiryMs).toISOString() : 'unknown'}`);

    // Use service role client to bypass RLS for token updates
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Persist updated tokens using sustainable timestamp format
    const updateData: any = {
      access_token: newAccess,
      expires_at: newExpiryMs ? toDatabaseTimestamp(newExpiryMs) : null,
      updated_at: toDatabaseTimestamp(new Date()),
    };

    // Only update refresh token if we got a new one
    if (newRefresh) {
      updateData.refresh_token = newRefresh;
    }

    const { error: upErr } = await serviceSupabase
      .from('user_tokens')
      .update(updateData)
      .eq('id', acct.id);

    if (upErr) {
      console.error('❌ Failed to save refreshed tokens:', upErr);
      throw new Error(`Failed to save refreshed tokens: ${upErr.message}`);
    }

    console.log('✅ Refreshed tokens saved to database');
    return newAccess;

  } catch (refreshError: any) {
    console.error('❌ Token refresh process failed:', refreshError.message);
    
    // Add context to the error for better debugging
    if (refreshError.message.includes('invalid_grant')) {
      throw new Error('Google refresh token is invalid or expired. Please reconnect your Google account.');
    } else if (refreshError.message.includes('network') || refreshError.message.includes('timeout')) {
      throw new Error('Network error during token refresh. Please try again.');
    } else {
      throw new Error(`Token refresh failed: ${refreshError.message}`);
    }
  }
}

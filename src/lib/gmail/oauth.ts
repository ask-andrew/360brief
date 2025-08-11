import { createServerSupabaseClient } from '@/lib/supabase/server';
import { refreshAccessToken } from '@/server/google/client';

// Returns a valid Google access token for the user's primary connected Google account.
// Requires to be called from a server context (Next.js route/loader) so cookies are available.
export async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = await createServerSupabaseClient();

  // Load the user's Google connected account (pick the first for now)
  const { data: accounts, error } = await supabase
    .from('user_connected_accounts')
    .select('id, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .limit(1);

  if (error) throw error;
  const acct = accounts?.[0];
  if (!acct) throw new Error('No connected Google account found for user');

  const now = Date.now();
  const exp = acct.expires_at ? new Date(acct.expires_at).getTime() : 0;
  const notExpired = !!acct.access_token && (!exp || exp - now > 60_000);
  if (notExpired) return acct.access_token as string;

  if (!acct.refresh_token) throw new Error('Missing Google refresh token; reconnect your account');

  // Refresh using Google OAuth client
  const creds = await refreshAccessToken(acct.refresh_token);
  const newAccess = creds.access_token as string | undefined;
  const newExpiryMs = (creds as any).expiry_date as number | undefined;

  if (!newAccess) throw new Error('Failed to refresh Google access token');

  // Persist updated tokens
  const { error: upErr } = await supabase
    .from('user_connected_accounts')
    .update({
      access_token: newAccess,
      expires_at: newExpiryMs ? new Date(newExpiryMs).toISOString() : null,
      // keep refresh_token as-is; Google may or may not return it on refresh
    })
    .eq('id', acct.id);

  if (upErr) throw upErr;
  return newAccess;
}

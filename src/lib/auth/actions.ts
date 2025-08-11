'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return { message: 'Signed out successfully' };
}

'use client';

import { supabase } from '@/lib/supabase/client';

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
  return { message: 'Signed out successfully' };
}

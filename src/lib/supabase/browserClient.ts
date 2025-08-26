'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Memoized single client instance per browser session.
let client: ReturnType<typeof createClientComponentClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createClientComponentClient();
  }
  return client;
}

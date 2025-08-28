"use client";

import { createBrowserClient } from "@supabase/ssr";

// Singleton instance for the browser client
let browserSupabase: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!browserSupabase) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Supabase environment variables are missing.");
    }

    browserSupabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      }
    );
  }
  return browserSupabase;
}

// For backward compatibility
export const supabase = getSupabaseClient();

import { createBrowserClient } from '@supabase/ssr/dist/module'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// For backward compatibility
export const supabase = createClient()
export const getSupabaseClient = createClient

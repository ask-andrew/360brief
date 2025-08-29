import { createServerClient } from '@supabase/ssr/dist/module'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name)
          return cookie?.value
        },
        async set(name: string, value: string, options: any) {
          try {
            await cookieStore.set(name, value, {
              ...options,
              sameSite: 'lax' as const,
              secure: process.env.NODE_ENV === 'production',
              path: '/',
            })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        async remove(name: string, options: any) {
          try {
            await cookieStore.set(name, '', {
              ...options,
              maxAge: 0,
              path: '/',
            })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = cookies();
  
  // Create a simple cookie handler object
  const cookieHandler = {
    async get(name: string) {
      const cookie = await cookieStore;
      return cookie.get(name)?.value;
    },
    async set(name: string, value: string, options: any) {
      try {
        const cookie = await cookieStore;
        cookie.set(name, value, {
          ...options,
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
      } catch (error) {
        console.error('Error setting cookie:', error);
      }
    },
    async remove(name: string, options: any) {
      try {
        const cookie = await cookieStore;
        cookie.set(name, '', {
          ...options,
          maxAge: 0,
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
      } catch (error) {
        console.error('Error removing cookie:', error);
      }
    },
  };

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieHandler,
    }
  );
}

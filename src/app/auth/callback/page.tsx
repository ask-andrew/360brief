'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        console.error('No code found in callback URL');
        return;
      }

      try {
        // Exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('Error exchanging code for session:', error.message);
          return;
        }

        if (data.session) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Callback handling error:', err);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Logging you in...</h1>
    </main>
  );
}

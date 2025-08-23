'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const error = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');

        if (error) {
          const message = errorDescription || 'Authentication failed';
          toast({ title: 'Authentication Error', description: message, variant: 'destructive' });
          router.push(`/login?error=${encodeURIComponent(message)}`);
          return;
        }

        // Get the stored redirect path or use default
        const redirectTo = sessionStorage.getItem('redirect_path') || '/dashboard';
        sessionStorage.removeItem('redirect_path');

        // Clean URL before redirect
        window.history.replaceState({}, document.title, window.location.pathname);

        // Redirect
        router.push(redirectTo);

      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        toast({ title: 'Authentication Error', description: message, variant: 'destructive' });
        router.push(`/login?error=${encodeURIComponent(message)}`);
      }
    };

    handleAuthCallback();
  }, [router, searchParams, supabase.auth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Just a moment</h2>
        <p className="text-gray-600">We're finalizing your sign in and will redirect you shortly.</p>
      </div>
    </div>
  );
}

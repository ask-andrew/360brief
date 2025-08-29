'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function AuthCodeHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams?.get('code');
    
    if (code) {
      console.log('🔗 Auth code detected on homepage, redirecting to callback...');
      
      // Redirect to the proper callback endpoint with all query parameters
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      
      // Copy all search params to the callback URL
      searchParams?.forEach((value, key) => {
        callbackUrl.searchParams.set(key, value);
      });
      
      router.replace(callbackUrl.toString());
    }
  }, [searchParams, router]);

  return null;
}
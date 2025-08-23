"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/config/supabase";
import { isAuthDebug, snapshotStorage, mask } from "@/utils/authDebug";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const restoredFetch = useRef<null | typeof window.fetch>(null);

  const code = useMemo(() => searchParams?.get("code") || null, [searchParams]);
  const providerError = useMemo(() => searchParams?.get("error") || null, [searchParams]);
  const errorDescription = useMemo(() => searchParams?.get("error_description") || null, [searchParams]);
  const redirectedFrom = useMemo(() => searchParams?.get("redirectedFrom") || "/dashboard", [searchParams]);

  useEffect(() => {
    const debug = isAuthDebug();

    // Temporarily wrap fetch to inspect token exchange traffic
    if (debug && typeof window !== 'undefined' && !restoredFetch.current) {
      restoredFetch.current = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        try {
          const url = typeof input === 'string' ? input : (input as URL).toString();
          const isToken = url.includes('/auth/v1/token');
          if (isToken) {
            // eslint-disable-next-line no-console
            console.log('[AUTHDBG] fetch ->', url, {
              method: init?.method,
              headers: init?.headers,
              body: typeof init?.body === 'string' ? `${(init!.body as string).slice(0, 80)}...` : '[non-string]'
            });
          }
          const resp = await restoredFetch.current!(input as any, init);
          if (isToken) {
            // Clone and log minimal info
            const cloned = resp.clone();
            const text = await cloned.text();
            // eslint-disable-next-line no-console
            console.log('[AUTHDBG] fetch <-', url, { status: resp.status, ok: resp.ok, body: text.slice(0, 200) + '...' });
          }
          return resp;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('[AUTHDBG] fetch error', e);
          throw e;
        }
      };
    }

    const run = async () => {
      try {
        if (debug) {
          // eslint-disable-next-line no-console
          console.log('[AUTHDBG] /auth/cb location', {
            href: typeof window !== 'undefined' ? window.location.href : 'n/a',
            origin: typeof window !== 'undefined' ? window.location.origin : 'n/a',
            pathname: typeof window !== 'undefined' ? window.location.pathname : 'n/a',
          });
          // eslint-disable-next-line no-console
          console.log('[AUTHDBG] query', { code: mask(code), state: searchParams?.get('state'), redirectedFrom, providerError, errorDescription });
          // eslint-disable-next-line no-console
          console.log('[AUTHDBG] storage', snapshotStorage());
          const preSess = await supabase.auth.getSession();
          const preUser = await supabase.auth.getUser();
          // eslint-disable-next-line no-console
          console.log('[AUTHDBG] pre-exchange session', preSess, 'user', preUser);
        }

        // Handle provider-side error directly
        if (providerError) {
          router.replace(`/login?error=oauth_error&message=${encodeURIComponent(errorDescription || providerError)}`);
          return;
        }

        if (!code) {
          router.replace(`/login?error=no_code`);
          return;
        }

        // Exchange authorization code for a session in the browser (PKCE verifier is here)
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (debug) {
          // eslint-disable-next-line no-console
          console.log('[AUTHDBG] exchangeCodeForSession result', { session: !!exchangeData?.session, user: !!exchangeData?.user, error: exchangeError?.message });
        }
        if (exchangeError) {
          setError(exchangeError.message);
          router.replace(`/login?error=auth_error&details=${encodeURIComponent(exchangeError.message)}`);
          return;
        }

        if (debug) {
          const postSess = await supabase.auth.getSession();
          const postUser = await supabase.auth.getUser();
          // eslint-disable-next-line no-console
          console.log('[AUTHDBG] post-exchange session', postSess, 'user', postUser);
        }

        // Success: redirect to the original page
        if (debug) {
          // eslint-disable-next-line no-console
          console.log('[AUTHDBG] redirecting to', redirectedFrom);
        }
        router.replace(redirectedFrom);
      } catch (e: any) {
        const msg = e?.message || "unexpected_error";
        setError(msg);
        router.replace(`/login?error=client_callback_error&details=${encodeURIComponent(msg)}`);
      }
    };

    // Kick off only when we have the params
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, providerError, errorDescription, redirectedFrom]);

  useEffect(() => {
    return () => {
      // Restore original fetch when leaving the page
      if (restoredFetch.current) {
        window.fetch = restoredFetch.current;
        restoredFetch.current = null;
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Finishing sign-in…</h1>
        {error ? (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Please wait while we complete authentication.</p>
        )}
      </div>
    </div>
  );
}

// app/auth/callback/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

// This is the server-side callback route that handles the authentication redirect from Supabase.
// It exchanges the `code` parameter in the URL for a user session.
export async function GET(request: NextRequest) {
  // Get the URL from the request.
  const requestUrl = new URL(request.url);
  // Extract the authorization `code` from the URL's search parameters.
  const code = requestUrl.searchParams.get('code');

  // If a code exists, it means we are in the authentication flow.
  if (code) {
    // Create a response that we can modify
    const response = NextResponse.redirect(requestUrl.origin);
    
    // Create a Supabase client with the request and response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              path: '/',
            });
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
              sameSite: 'lax',
              path: '/',
            });
          },
        },
      }
    );

    // Call the Supabase API to exchange the auth code for a user session.
    // This is the function that requires the `code_verifier` from the cookie.
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    // If there is no error, the authentication was successful.
    if (!error) {
      // Redirect the user to the dashboard.
      return NextResponse.redirect(requestUrl.origin);
    }
  }

  // If the authentication flow fails or the `code` is missing,
  // redirect the user back to the sign-in page with an error message.
  return NextResponse.redirect(`${requestUrl.origin}/signin?error=Failed to sign in`);
}

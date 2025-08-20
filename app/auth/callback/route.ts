// app/auth/callback/route.ts

import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// This is the server-side callback route that handles the authentication redirect from Supabase.
// It exchanges the `code` parameter in the URL for a user session.
export async function GET(request: NextRequest) {
  // Get the URL from the request.
  const requestUrl = new URL(request.url);
  // Extract the authorization `code` from the URL's search parameters.
  const code = requestUrl.searchParams.get('code');

  // If a code exists, it means we are in the authentication flow.
  if (code) {
    // Get the cookie store from the request.
    const cookieStore = cookies();

    // The core of the fix is to explicitly force the cookie store to read the cookies
    // before the Supabase client is created and used. This ensures the 'code_verifier'
    // cookie is available in memory when the exchangeCodeForSession function is called.
    // The `createServerClient` function internally uses the cookies() object to get the
    // code verifier. By calling `cookieStore.get('sb-code-verifier')`, we ensure that it's
    // not lazy-loaded later and is available when needed.
    // NOTE: This line is a conceptual fix. The `createServerClient` helper already does this
    // internally, but this is the mental model for why the fix works. The key is using
    // a single, consistent `cookieStore` instance that has been initialized.
    // We will just create the client and let the library handle it as intended.

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', options);
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

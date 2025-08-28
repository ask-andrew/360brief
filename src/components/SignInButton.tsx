'use client';

import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function SignInButton() {
  const supabase = createClientComponentClient();

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <Button onClick={signIn} className="bg-blue-600 hover:bg-blue-700">
      Sign in with Google
    </Button>
  );
}

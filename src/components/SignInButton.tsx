'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function SignInButton() {
  const { signInWithGoogle } = useAuth();

  return (
    <Button 
      onClick={signInWithGoogle} 
      className="bg-blue-600 hover:bg-blue-700"
    >
      Sign in with Google
    </Button>
  );
}

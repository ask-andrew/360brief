'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/config/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Use a single shared browser client across the app to ensure PKCE + storage consistency

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)

        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, router])

  // No manual OAuth state management; Supabase handles state + PKCE internally.

  const signIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Store the current path to redirect back after login
      const redirectTo = window.location.pathname === '/login' 
        ? '/dashboard' 
        : window.location.pathname + window.location.search;
      
      // Build callback URL consistently with current origin (client page handles exchange)
      const redirectUrl = new URL('/auth/cb', window.location.origin);
      redirectUrl.searchParams.set('redirectedFrom', redirectTo);

      console.log('Initiating OAuth flow');

      // Start the OAuth flow; let Supabase manage state + PKCE and perform redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          scopes: 'email profile',
          skipBrowserRedirect: false
        },
      });
      
      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }
      
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during sign in');
      setIsLoading(false);
      throw error;
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    error,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        error,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  connectGmail: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  const supabase = createClient()

  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Refreshing auth state...')
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        throw sessionError
      }
      
      console.log('✅ Session retrieved:', session ? 'Found' : 'None')
      
      setSession(session)
      setUser(session?.user ?? null)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown auth error'
      console.error('❌ Auth refresh error:', errorMessage)
      setError(errorMessage)
      setSession(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    // Initial auth state check
    refreshAuth()
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔑 Auth state changed: ${event}`)
        setSession(session)
        setUser(session?.user ?? null)
        
        // If user just signed in, refresh auth state
        if (event === 'SIGNED_IN') {
          await refreshAuth()
          router.push('/dashboard')
        }
      }
    )
    
    // Clean up listener on unmount
    return () => {
      subscription?.unsubscribe()
    }
  }, [refreshAuth, router])

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔐 Initiating Supabase Google OAuth with Gmail scopes...')
      
      // Use native Supabase OAuth which handles both auth AND session creation in one flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly'
          },
        },
      })

      if (error) throw error
      if (!data?.url) throw new Error('No OAuth URL received')
      
      // Redirect to Google OAuth (which will come back to /auth/callback)
      window.location.href = data.url
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google'
      console.error('❌ Sign in error:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const connectGmail = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📧 Connecting Gmail via direct OAuth...')
      
      // Use direct Gmail OAuth flow instead of Supabase OAuth
      // This redirects to /api/auth/gmail/authorize which handles the full OAuth flow
      window.location.href = '/api/auth/gmail/authorize'
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect Gmail'
      console.error('❌ Gmail connect error:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔐 Signing in with email...')
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) {
        console.error('❌ Sign in error:', signInError)
        throw signInError
      }
      
      console.log('✅ Successfully signed in with email')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      console.error('❌ Sign in error:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📝 Signing up with email...')
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (signUpError) {
        console.error('❌ Sign up error:', signUpError)
        throw signUpError
      }
      
      console.log('✅ Successfully signed up with email')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up'
      console.error('❌ Sign up error:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('👋 Signing out...')
      
      const { error: signOutError } = await supabase.auth.signOut()
      
      if (signOutError) {
        console.error('❌ Sign out error:', signOutError)
        throw signOutError
      }
      
      console.log('✅ Successfully signed out')
      
      // Clear local state
      setSession(null)
      setUser(null)
      
      // Redirect to login page
      router.push('/login')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out'
      console.error('❌ Sign out error:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  const value = {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    connectGmail,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshAuth,
  }

  return (
    <AuthContext.Provider value={value}>
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

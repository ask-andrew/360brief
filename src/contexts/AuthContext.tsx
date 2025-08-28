'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const refreshAuth = async () => {
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
  }

  useEffect(() => {
    // Initial auth check
    refreshAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', event, session ? 'Session exists' : 'No session')
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setError(null)
        
        // Handle specific events
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed successfully')
        }
        
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in successfully')
        }
      }
    )

    return () => {
      console.log('🧹 Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signInWithGoogle = async () => {
    try {
      setError(null)
      console.log('🚀 Starting Google sign in...')
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      
      if (error) {
        console.error('❌ Google sign in error:', error)
        throw error
      }
      
      console.log('✅ Google sign in initiated')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      console.error('❌ Sign in error:', errorMessage)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      console.log('🚪 Signing out...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Sign out error:', error)
        throw error
      }
      
      console.log('✅ Signed out successfully')
      setSession(null)
      setUser(null)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
      console.error('❌ Sign out error:', errorMessage)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
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

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

type SignUpResponse = {
  error: Error | null;
  user?: User | null;
  session?: Session | null;
};

type SignInResponse = {
  error: Error | null;
  user?: User | null;
  session?: Session | null;
};

type SignInWithOAuthResponse = {
  error: Error | null;
  url?: string | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResponse>;
  signInWithOAuth: (options: {
    provider: 'google' | 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'discord' | 'facebook' | 'twitter' | 'twitch' | 'apple' | 'linkedin_oidc' | 'notion' | 'slack' | 'spotify' | 'twitch' | 'workos';
    options?: {
      redirectTo?: string;
      scopes?: string;
      queryParams?: Record<string, string>;
    };
  }) => Promise<SignInWithOAuthResponse>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<SignUpResponse>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Helper function to set error state and log it
  const handleError = (error: Error | unknown, message?: string) => {
    const errorObj = error instanceof Error ? error : new Error(message || 'An unknown error occurred');
    console.error(message || 'Auth error:', error);
    setError(errorObj);
    setLoading(false);
    return errorObj;
  };

  useEffect(() => {
    // Eagerly load existing session, then subscribe to changes
    let isMounted = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!isMounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } catch (e) {
        console.warn('AuthContext: getSession failed', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      setUser(data.user ?? null);
      setSession(data.session ?? null);
    }
    return { error, user: data?.user ?? null, session: data?.session ?? null };
  };

  const signUp = async (email: string, password: string, metadata: Record<string, any> = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.fullName || '',
            ...metadata
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });

      if (error) throw error;

      // Update local state if sign up was successful
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
      }

      return {
        error: null,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        error: error as Error,
        user: null,
        session: null,
      };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  const signInWithOAuth = async ({
    provider,
    options = {},
  }: {
    provider: 'google' | 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'discord' | 'facebook' | 'twitter' | 'twitch' | 'apple' | 'linkedin_oidc' | 'notion' | 'slack' | 'spotify' | 'workos';
    options?: {
      redirectTo?: string;
      scopes?: string;
      queryParams?: Record<string, string>;
    };
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear any existing auth state to prevent conflicts
      console.log('Signing out any existing session...');
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.warn('Error during sign out:', signOutError);
      }
      
      // Generate a random state parameter for CSRF protection
      const state = Math.random().toString(36).substring(2);
      
      // Generate a secure random code verifier for PKCE
      const generateCodeVerifier = () => {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      };
      
      const codeVerifier = generateCodeVerifier();
      
      // Store the state and code verifier in cookies that will be accessible to the callback route
      const cookieOptions = `path=/; max-age=3600; samesite=lax${window.location.protocol === 'https:' ? '; secure' : ''}`;
      document.cookie = `oauth_state=${state}; ${cookieOptions}`;
      document.cookie = `code_verifier=${codeVerifier}; ${cookieOptions}`;
      
      // Store the code verifier in localStorage for the Supabase client
      if (typeof window !== 'undefined') {
        try {
          // Clear any existing auth state
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.includes('code-verifier') || 
                key?.includes('provider-token') || 
                key?.includes('supabase.auth.token')) {
              keysToRemove.push(key);
            }
          }
          
          keysToRemove.forEach(key => {
            console.log('Removing auth key:', key);
            localStorage.removeItem(key);
          });
          
          // Store the code verifier in localStorage for the Supabase client
          localStorage.setItem(`sb-${provider}-auth-code-verifier`, codeVerifier);
          localStorage.setItem(`sb-${provider}-auth-state`, state);
        } catch (storageError) {
          console.warn('Error managing localStorage:', storageError);
          throw new Error('Failed to initialize authentication session');
        }
      }
      
      // Prepare the OAuth options
      const oauthOptions = {
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            ...options.queryParams,
            access_type: 'offline',
            prompt: 'select_account',
            include_granted_scopes: 'true',
            state: state,
          },
          scopes: options.scopes || 'email profile openid https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
          skipBrowserRedirect: false,
          // Enable PKCE flow
          flowType: 'pkce',
          // Pass the code verifier
          codeVerifier: codeVerifier,
        },
      };
      
      console.log('Initiating OAuth flow with options:', {
        ...oauthOptions,
        options: {
          ...oauthOptions.options,
          queryParams: {
            ...oauthOptions.options.queryParams,
            // Don't log sensitive data
            client_id: '***',
            state: '***',
          }
        }
      });
      
      // Start the OAuth flow
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth(oauthOptions);
      
      if (oauthError) {
        throw handleError(oauthError, 'OAuth error during sign-in');
      }
      
      if (!data?.url) {
        throw handleError(new Error('No redirect URL received from OAuth provider'));
      }
      
      console.log('OAuth flow initiated successfully');
      return { error: null, url: data.url };
    } catch (error: any) {
      console.error('Error in signInWithOAuth:', error);
      return {
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
        url: null,
      };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signInWithOAuth,
    signUp,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

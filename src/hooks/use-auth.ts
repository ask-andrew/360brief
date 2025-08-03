import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, getCurrentUser } from '@/lib/supabase/auth';
import { LoginFormData, RegisterFormData } from '@/lib/validations/auth';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { 
    user, 
    session, 
    isLoading: isAuthLoading, 
    setUser, 
    setSession, 
    setLoading, 
    setError, 
    clear 
  } = useAuthStore();

  // Get current user
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      if (user) return user;
      
      try {
        setLoading(true);
        const user = await getCurrentUser();
        if (user) {
          setUser(user);
          return user;
        }
        return null;
      } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    enabled: !user && !isAuthLoading,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      setLoading(true);
      try {
        const { user, session } = await signInWithEmail(data.email, data.password);
        setUser(user);
        setSession(session);
        return { user, session };
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      setLoading(true);
      try {
        const { user, session } = await signUpWithEmail(
          data.email, 
          data.password, 
          data.fullName
        );
        setUser(user);
        setSession(session);
        return { user, session };
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      router.push('/dashboard/onboarding');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Google sign in mutation
  const signInWithGoogleMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      try {
        const { url } = await signInWithGoogle();
        if (url) {
          window.location.href = url;
        }
      } finally {
        setLoading(false);
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      try {
        await signOut();
        clear();
        queryClient.clear();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  return {
    user: user || currentUser,
    session,
    isLoading: isUserLoading || isAuthLoading,
    isAuthenticated: !!user || !!currentUser,
    login: loginMutation.mutateAsync,
    loginWithGoogle: signInWithGoogleMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: signOutMutation.mutateAsync,
    error: useAuthStore.getState().error,
    clearError: () => setError(null),
  };
}

export function useProtectedRoute(redirectTo = '/login') {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  
  if (!isLoading && !user) {
    router.push(redirectTo);
  }
  
  return { user, isLoading };
}

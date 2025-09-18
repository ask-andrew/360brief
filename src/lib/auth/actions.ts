'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { CustomUserAttributes } from './types';

/**
 * Server action to sign up with email and password
 */
export async function signUpWithEmail(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const fullName = formData.get('fullName')?.toString();

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      } as CustomUserAttributes,
    },
  });

  if (error) {
    console.error(error.message);
    return { error: error.message };
  }

  return { success: true, user: data.user };
}

/**
 * Server action to sign in with email and password
 */
export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error(error.message);
    return { error: error.message };
  }

  return { success: true, user: data.user };
}

/**
 * Server action to sign out
 */
export async function signOut(redirectTo: string = '/login') {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(error.message);
    return { error: error.message };
  }

  redirect(redirectTo);
}

/**
 * Server action to get the current session
 */
export async function getSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error(error.message);
    return { error: error.message };
  }

  return { session: data.session };
}

/**
 * Server action to refresh the current session
 */
export async function refreshSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    console.error(error.message);
    return { error: error.message };
  }

  return { session: data.session };
}

/**
 * Server action to handle OAuth sign in
 */
export async function signInWithOAuth(provider: 'google' | 'github' = 'google') {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL is not defined in environment variables');
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No redirect URL received from OAuth provider');

    return { url: data.url };
  } catch (error: any) {
    console.error('OAuth error:', error);
    return { error: error.message || 'Failed to initiate OAuth flow' };
  }
}

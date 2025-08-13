import { createClient } from './server';
import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  company_data?: Record<string, any>;
  updated_at?: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as Profile;
    
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function updateProfile(
  userId: string, 
  updates: Partial<Profile>
): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
    
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data as User;
    
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

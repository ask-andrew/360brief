import { Database } from '@/lib/types/database.types';
import { supabase } from '@/lib/supabase/db';

export interface DigestSchedule {
  id?: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'weekdays';
  time: string;
  timezone: string;
  includeEmails: boolean;
  includeCalendar: boolean;
  summaryLength: 'brief' | 'detailed' | 'comprehensive';
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export const createDigestSchedule = async (digest: Omit<DigestSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('digest_schedules')
    .insert([{
      user_id: digest.userId,
      name: digest.name,
      description: digest.description,
      frequency: digest.frequency,
      time: digest.time,
      timezone: digest.timezone,
      include_emails: digest.includeEmails,
      include_calendar: digest.includeCalendar,
      summary_length: digest.summaryLength,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating digest schedule:', error);
    throw error;
  }

  return data;
};

export const getDigestSchedules = async (userId: string): Promise<DigestSchedule[]> => {
  if (!userId) {
    console.error('User ID is required');
    throw new Error('Authentication required: No user ID provided');
  }

  console.log('Fetching digest schedules for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('digest_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch digest schedules: ${error.message}`);
    }

    console.log('Fetched digest schedules:', data);
    
    // Transform the data to match our frontend types
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      frequency: item.frequency,
      time: item.time,
      timezone: item.timezone,
      includeEmails: item.include_emails,
      includeCalendar: item.include_calendar,
      summaryLength: item.summary_length,
      userId: item.user_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  } catch (error) {
    console.error('Error in getDigestSchedules:', error);
    // Re-throw the error to be handled by the UI
    if (error instanceof Error) {
      throw new Error(`Failed to fetch digest schedules: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching digest schedules');
  }
};

export const updateDigestSchedule = async (id: string, updates: Partial<DigestSchedule>) => {
  const { data, error } = await supabase
    .from('digest_schedules')
    .update({
      name: updates.name,
      description: updates.description,
      frequency: updates.frequency,
      time: updates.time,
      timezone: updates.timezone,
      include_emails: updates.includeEmails,
      include_calendar: updates.includeCalendar,
      summary_length: updates.summaryLength,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating digest schedule:', error);
    throw error;
  }

  return data;
};

export const deleteDigestSchedule = async (id: string) => {
  const { error } = await supabase
    .from('digest_schedules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting digest schedule:', error);
    throw error;
  }

  return true;
};

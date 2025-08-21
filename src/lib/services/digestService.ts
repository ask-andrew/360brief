import { supabase } from '@/lib/supabase/client';

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
  const { data, error } = await (supabase as any)
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
    const { data, error } = await (supabase as any)
      .from('digest_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Log as much detail as possible for debugging
      console.error('Supabase error fetching digest_schedules', {
        error,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        message: (error as any)?.message,
      });

      const code = (error as any)?.code;
      const message = (error as any)?.message || 'Unknown error';

      // Common causes:
      //  - 42P01: relation does not exist (migrations not applied)
      //  - 42501 / permission denied: RLS blocking because user not authenticated
      if (code === '42P01' || /relation .* does not exist/i.test(message)) {
        throw new Error('Digest schedules table is missing. Run Supabase migrations locally: "supabase migration up".');
      }
      if (code === '42501' || /permission denied/i.test(message)) {
        throw new Error('Permission denied reading digest schedules. Ensure you are signed in and RLS policies are applied.');
      }
      throw new Error(`Failed to fetch digest schedules: ${message}`);
    }

    console.log('Fetched digest schedules:', data);
    
    // Transform the data to match our frontend types
    return (data || []).map((raw: any) => ({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      frequency: raw.frequency,
      time: raw.time,
      timezone: raw.timezone,
      includeEmails: raw.include_emails,
      includeCalendar: raw.include_calendar,
      summaryLength: raw.summary_length,
      userId: raw.user_id,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
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
  const { data, error } = await (supabase as any)
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
  const { error } = await (supabase as any)
    .from('digest_schedules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting digest schedule:', error);
    throw error;
  }

  return true;
};

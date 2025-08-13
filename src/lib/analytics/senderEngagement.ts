import { createClient } from '@/lib/supabase/server';
import { EmailMessage } from '@/lib/gmail/client';

export async function updateSenderEngagement(userId: string, email: EmailMessage, action: 'received' | 'opened' | 'replied') {
  const supabase = createClient();
  const senderEmail = email.from.email;
  const senderName = email.from.name;
  const clientName = extractClientName(senderEmail);
  const now = new Date().toISOString();

  try {
    // First, try to update existing record
    const { data: existing, error: selectError } = await supabase
      .from('sender_engagement_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('sender_email', senderEmail)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching sender metrics:', selectError);
      return;
    }

    const updates: Record<string, any> = {
      user_id: userId,
      sender_email: senderEmail,
      sender_name: senderName || existing?.sender_name || null,
      client_name: clientName || existing?.client_name || null,
      last_interaction: now,
      updated_at: now,
    };

    // Update counts based on action
    if (action === 'received') {
      updates.total_received = (existing?.total_received || 0) + 1;
    } else if (action === 'opened') {
      updates.total_opened = (existing?.total_opened || 0) + 1;
      if (!existing?.total_received) {
        updates.total_received = 1; // Ensure received is at least 1 if marked as opened
      }
    } else if (action === 'replied') {
      updates.total_replied = (existing?.total_replied || 0) + 1;
      if (!existing?.total_received) {
        updates.total_received = 1; // Ensure received is at least 1 if marked as replied
      }
    }

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('sender_engagement_metrics')
        .update(updates)
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Insert new record with initial values
      const initialValues = {
        ...updates,
        total_received: action === 'received' ? 1 : 0,
        total_opened: action === 'opened' ? 1 : 0,
        total_replied: action === 'replied' ? 1 : 0,
      };

      const { error: insertError } = await supabase
        .from('sender_engagement_metrics')
        .insert(initialValues);

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error updating sender engagement metrics:', error);
    // Fail silently in production
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  }
}

function extractClientName(email: string): string | null {
  try {
    const domain = email.split('@')[1];
    if (!domain) return null;
    
    // Remove common domain suffixes for cleaner display
    return domain
      .replace(/\.(com|net|org|io|co\.\w{2,3}|ai|dev)$/i, '')
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  } catch (error) {
    console.error('Error extracting client name:', error);
    return null;
  }
}

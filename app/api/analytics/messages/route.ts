import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@/lib/supabase/server';
import { ensureValidAccessToken } from '@/services/analytics/tokens';
import { fetchGmailMessages } from '@/services/analytics/gmail';
import { Database } from '@/types/supabase';

// Helper to safely extract a header value
function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find(h => (h.name || '').toLowerCase() === name.toLowerCase())?.value || '';
}

function extractEmail(addr: string): string {
  const m = addr.match(/<([^>]+)>/);
  return (m ? m[1] : addr).trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysBack = Math.max(1, Math.min(31, Number(searchParams.get('daysBack') || 7)));
    const maxResults = Math.max(10, Math.min(200, Number(searchParams.get('max') || 100)));

    // Server-side Supabase client
    const supabase = await createClient();

    // Get user with profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email from profiles table (source of truth)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();
    
    const userEmail = profile?.email || user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 });
    }

    // Ensure valid Google OAuth client
    let oauth2: OAuth2Client;
    try {
      const result = await ensureValidAccessToken(supabase as any, user.id);
      oauth2 = result.oauth2;
    } catch (e) {
      return NextResponse.json({ error: 'Google access token not available' }, { status: 400 });
    }

    // Fetch recent Gmail messages (metadata scope)
    const gmailMessages = await fetchGmailMessages(oauth2, daysBack, maxResults);

    // Normalize to SentimentInsights message shape using snippet as body
    const normalized = gmailMessages.map((m) => {
      const headers = m.payload?.headers || [];
      const fromRaw = getHeader(headers, 'From');
      const toRaw = getHeader(headers, 'To');
      const subject = getHeader(headers, 'Subject');
      const dateHdr = getHeader(headers, 'Date');

      const fromEmail = extractEmail(fromRaw);
      const toEmail = extractEmail(toRaw);

      const isSent = !!userEmail && fromRaw.includes(userEmail);
      const timestamp = m.internalDate ? new Date(Number(m.internalDate)).toISOString() : (dateHdr || new Date().toISOString());

      return {
        id: m.id || crypto.randomUUID(),
        subject: subject || '(no subject)',
        body: m.snippet || '',
        timestamp,
        from: fromEmail || fromRaw || '',
        to: toEmail || undefined,
        isRead: undefined,
        isSent,
      };
    }).filter(msg => !!msg.from);

    const sentCount = normalized.filter(n => n.isSent).length;
    const receivedCount = normalized.length - sentCount;

    return NextResponse.json({
      userEmail,
      total: normalized.length,
      sentCount,
      receivedCount,
      messages: normalized,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('analytics/messages error', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

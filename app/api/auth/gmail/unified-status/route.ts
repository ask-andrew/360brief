import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleConnectionStatus } from '@/lib/gmail/unified-oauth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    console.log(`🔍 Checking unified Gmail connection status for user: ${user.id}`);

    const status = await getGoogleConnectionStatus(user.id);
    
    return NextResponse.json({
      authenticated: status.connected,
      user_id: user.id,
      connection_details: status,
      message: status.connected 
        ? 'Google account connected via unified OAuth'
        : 'No Google account connected'
    });

  } catch (error) {
    console.error('❌ Gmail status check error:', error);
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Failed to check Gmail connection'
    }, { status: 500 });
  }
}
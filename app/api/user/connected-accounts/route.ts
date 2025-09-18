import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('🔍 GET /api/user/connected-accounts');
  
  try {
    const supabase = await createClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication error', details: authError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.warn('⚠️ Unauthorized: No user session');
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in' },
        { status: 401 }
      );
    }

    console.log(`🔑 Fetching connected accounts for user: ${user.id}`);
    
    // Fetch connected accounts
    const { data, error } = await supabase
      .from('user_connected_accounts')
      .select('id, provider, provider_account_id, email, account_type, scopes, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} connected accounts`);
    return NextResponse.json({ accounts: data || [] });
    
  } catch (error: any) {
    console.error('❌ Server error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch connected accounts',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

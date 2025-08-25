import { NextResponse } from 'next/server';
import { generateAuthUrl } from '@/server/google/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Create a direct Supabase client
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Try to get the current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return NextResponse.json(
        { error: 'Failed to authenticate' },
        { status: 401 }
      );
    }

    // If no user found, return unauthorized
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const redirectPath = searchParams.get('redirect') || '/dashboard';
    const accountType = searchParams.get('account_type') === 'business' ? 'business' : 'personal';

    const url = generateAuthUrl({ redirect: redirectPath, account_type: accountType });
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to initiate Google OAuth' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { generateAuthUrl } from '@/server/google/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient as createSupabaseServerClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabase = createServerSupabaseClient();
    let { data: { user } } = await supabase.auth.getUser();

    // Fallback: Authorization: Bearer <jwt>
    if (!user) {
      const authz = (req.headers as any).get?.('authorization') || (req.headers as any).get?.('Authorization');
      const match = authz?.match(/^Bearer\s+(.+)$/i);
      const jwt = match?.[1];
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (jwt && url && serviceKey) {
        const admin = createSupabaseServerClient(url, serviceKey);
        const { data, error } = await admin.auth.getUser(jwt);
        if (!error) user = data.user as any;
      }
    }

    if (!user) return NextResponse.json({ error: 'Unauthorized: please sign in before connecting Google.' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const redirectPath = searchParams.get('redirect') || '/dashboard';
    const accountType = searchParams.get('account_type') === 'business' ? 'business' : 'personal';

    const url = generateAuthUrl({ redirect: redirectPath, account_type: accountType });
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to initiate Google OAuth' }, { status: 500 });
  }
}

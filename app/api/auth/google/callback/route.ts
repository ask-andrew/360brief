import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/login?error=unauthorized`);
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard`);
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/login?error=server_error`);
  }
}

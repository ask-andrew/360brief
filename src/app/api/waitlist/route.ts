import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-only env vars
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase env for waitlist route');
}

const supabaseAdmin = SUPABASE_URL && SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY)
  : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Minimal validation (no zod to avoid new deps)
    const email = (body?.email || '').toString().trim().toLowerCase();
    const consent = !!body?.consent;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: 'Consent required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const payload = {
      email,
      name: (body?.name || '').toString().slice(0, 120) || null,
      role: (body?.role || '').toString().slice(0, 120) || null,
      company_size: (body?.company_size || '').toString().slice(0, 50) || null,
      tools: Array.isArray(body?.tools) ? body.tools.slice(0, 20) : [],
      pain_point: (body?.pain_point || '').toString().slice(0, 1000) || null,
      must_haves: Array.isArray(body?.must_haves) ? body.must_haves.slice(0, 20) : [],
      delivery_pref: (body?.delivery_pref || '').toString().slice(0, 50) || null,
      style_pref: (body?.style_pref || '').toString().slice(0, 50) || null,
      willing_call: !!body?.willing_call,
      source: (body?.source || '').toString().slice(0, 120) || null,
    };

    const { data, error } = await supabaseAdmin
      .from('waitlist')
      .upsert(payload, { onConflict: 'email' })
      .select('id, email')
      .single();

    if (error) {
      console.error('Waitlist insert error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id, email: data?.email });
  } catch (err) {
    console.error('Waitlist route error:', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

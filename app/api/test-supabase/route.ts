import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Simple query against a known table to validate connection
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) throw error as any;

    return Response.json({
      success: true,
      data: data || [],
      message: 'Successfully connected to Supabase!',
      connectionInfo: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-4) : 'Not set'
      }
    });
  } catch (error) {
    console.error('Supabase connection error:', error);
    const err = error as any;
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Unknown error',
        details: err?.details || null,
        hint: err?.hint || null,
        code: err?.code || null,
        message: 'Failed to connect to Supabase',
        connectionInfo: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-4) : 'Not set'
        }
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

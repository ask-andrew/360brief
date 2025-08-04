import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Test connection by fetching server timestamp
    const { data, error } = await supabase.rpc('get_server_timestamp');
    
    if (error) {
      // If the function doesn't exist, try a simple query
      if (error.code === 'PGRST116') {
        const { data: testData, error: queryError } = await supabase
          .from('test_table')
          .select('*')
          .limit(1);
          
        if (queryError) throw queryError;
        
        return Response.json({
          success: true,
          data: testData || [],
          message: 'Successfully connected to Supabase! (Using test_table)',
          connectionInfo: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-4) : 'Not set'
          }
        });
      }
      throw error;
    }

    return Response.json({
      success: true,
      data: data,
      message: 'Successfully connected to Supabase! (Using RPC)',
      connectionInfo: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-4) : 'Not set'
      }
    });
  } catch (error: any) {
    console.error('Supabase connection error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
        details: error.details || null,
        hint: error.hint || null,
        code: error.code || null,
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

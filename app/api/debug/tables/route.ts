import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Try a simple insert test to see what the actual error is
    const testData = {
      user_id: 'test-id-123',
      provider: 'google',
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_at: Math.floor(Date.now() / 1000), // Use Unix timestamp in seconds for bigint
    };

    console.log('Testing insert with data:', testData);

    const { error: insertError } = await supabase
      .from('user_tokens')
      .insert(testData);

    if (insertError) {
      console.log('Insert error details:', insertError);
    }

    // Try to read existing records
    const { data: existingTokens, error: selectError } = await supabase
      .from('user_tokens')
      .select('*')
      .limit(3);

    return NextResponse.json({
      success: !insertError,
      insertError,
      selectError,
      existingTokens: existingTokens || [],
      testData
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
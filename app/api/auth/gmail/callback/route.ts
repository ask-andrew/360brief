import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/server/google/client';
import { createClient } from '@/lib/supabase/server';

// Force Node.js runtime for service role operations
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const redirectUrl = new URL('/dashboard', request.url);

  try {
    if (error) {
      console.error('❌ Gmail OAuth error:', error);
      redirectUrl.searchParams.set('auth', 'error');
      redirectUrl.searchParams.set('message', error);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code) {
      redirectUrl.searchParams.set('auth', 'error');
      redirectUrl.searchParams.set('message', 'No authorization code received');
      return NextResponse.redirect(redirectUrl);
    }

    console.log('🔄 Gmail callback received code, exchanging for tokens...');

    // Exchange code for tokens using direct Next.js implementation
    const tokens = await exchangeCodeForTokens(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Invalid tokens received from Google');
    }

    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Ensure profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id, 
        email: user.email || '',
        // Add any other default profile fields here 
      })
      .select()
      .single();

    if (profileError) {
      console.warn('⚠️ Warning: Could not create/update profile:', profileError);
    }

    console.log('🔄 Storing Gmail tokens in Supabase...');

    // Store tokens using sustainable timestamp utilities and service role for RLS bypass
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const tokenData = {
      user_id: user.id,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null, // Convert Google's milliseconds to Unix seconds
      updated_at: Math.floor(Date.now() / 1000), // Store as Unix timestamp
    };
    
    console.log(`🔍 Storing token data:`, {
      user_id: tokenData.user_id,
      provider: tokenData.provider,
      expires_at: tokenData.expires_at,
      expires_raw: tokens.expiry_date,
    });
    
    const { data: insertData, error: tokenError } = await serviceSupabase
      .from('user_tokens')
      .upsert(tokenData, {
        onConflict: 'user_id,provider'
      })
      .select();

    if (tokenError) {
      console.error('❌ Token insert error:', tokenError);
      
      // More specific error handling for common issues
      if (tokenError.code === '23505') {
        console.log('🔄 Duplicate key error - attempting direct update...');
        
        // Try direct update instead of upsert
        const { error: updateError } = await serviceSupabase
          .from('user_tokens')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: tokenData.expires_at,
            updated_at: Math.floor(Date.now() / 1000), // Store as Unix timestamp
          })
          .eq('user_id', user.id)
          .eq('provider', 'google');
          
        if (updateError) {
          console.error('❌ Token update also failed:', updateError);
          redirectUrl.searchParams.set('auth', 'error');
          redirectUrl.searchParams.set('message', 'Failed to save Gmail connection');
          return NextResponse.redirect(redirectUrl);
        }
        
        console.log('✅ Gmail tokens updated successfully after duplicate error');
      } else {
        redirectUrl.searchParams.set('auth', 'error');
        redirectUrl.searchParams.set('message', 'Failed to save Gmail connection');
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      console.log('✅ Gmail tokens stored successfully', insertData?.length ? `(${insertData.length} records)` : '');
    }
    
    // Redirect to dashboard with success message
    redirectUrl.searchParams.set('auth', 'success');
    redirectUrl.searchParams.set('message', 'Gmail connected successfully!');
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ Gmail Callback Error:', error);
    
    redirectUrl.searchParams.set('auth', 'error');
    redirectUrl.searchParams.set('message', 
      error instanceof Error ? error.message : 'Gmail connection failed'
    );
    return NextResponse.redirect(redirectUrl);
  }
}
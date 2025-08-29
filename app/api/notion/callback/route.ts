import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  const supabase = await createClient();
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.redirect(
      new URL('/login?error=not_authenticated', request.url)
    );
  }

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=notion_${error}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=notion_no_code', request.url)
    );
  }

  try {
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/notion/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to get access token');
    }

    // Get workspace info
    const workspaceResponse = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Notion-Version': '2022-06-28',
      },
    });

    const workspaceData = await workspaceResponse.json();

    if (!workspaceResponse.ok) {
      throw new Error('Failed to get workspace info');
    }

    // Save the connection to the database
    const { error: dbError } = await supabase
      .from('notion_connections')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        bot_id: tokenData.bot_id,
        workspace_name: tokenData.workspace_name,
        workspace_icon: tokenData.workspace_icon,
        owner_user_id: workspaceData.owner?.user?.id,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,bot_id',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save Notion connection');
    }

    // Redirect to the integrations page with success message
    return NextResponse.redirect(
      new URL('/settings/integrations?success=notion_connected', request.url)
    );

  } catch (error) {
    console.error('Notion OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=notion_oauth_error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
}

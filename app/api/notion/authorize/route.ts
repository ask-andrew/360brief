import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Construct the Notion OAuth URL
  const notionAuthUrl = new URL('https://api.notion.com/v1/oauth/authorize');
  notionAuthUrl.searchParams.append('client_id', process.env.NOTION_CLIENT_ID || '');
  notionAuthUrl.searchParams.append('response_type', 'code');
  notionAuthUrl.searchParams.append('owner', 'user');
  notionAuthUrl.searchParams.append('redirect_uri', `${process.env.NEXT_PUBLIC_SITE_URL}/api/notion/callback`);

  // Redirect to Notion's OAuth page
  return NextResponse.redirect(notionAuthUrl.toString());
}

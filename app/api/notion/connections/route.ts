import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get user's Notion connections
  const { data, error } = await supabase
    .from('notion_connections')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Database error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch Notion connections' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Don't send sensitive data to the client
  const sanitizedData = data.map(connection => ({
    id: connection.id,
    bot_id: connection.bot_id,
    workspace_name: connection.workspace_name,
    workspace_icon: connection.workspace_icon,
    created_at: connection.created_at,
    last_synced_at: connection.last_synced_at
  }));

  return new NextResponse(
    JSON.stringify(sanitizedData),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get('id');
  
  if (!connectionId) {
    return new NextResponse(
      JSON.stringify({ error: 'Connection ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = await createClient();
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Delete the connection
  const { error } = await supabase
    .from('notion_connections')
    .delete()
    .eq('id', connectionId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Database error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to delete Notion connection' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new NextResponse(
    JSON.stringify({ success: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

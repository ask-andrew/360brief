import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug real Gmail endpoint called');
    
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated', 
        userError: userError?.message 
      });
    }
    
    console.log(`🔍 User found: ${user.email}`);
    
    // Get Gmail tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .limit(1);
    
    if (tokenError || !tokens?.[0]) {
      return NextResponse.json({ 
        error: 'No Gmail tokens found', 
        tokenError: tokenError?.message 
      });
    }
    
    const token = tokens[0];
    console.log(`🔍 Token found, expires: ${token.expires_at}`);
    
    // Check if token needs refresh
    const now = Math.floor(Date.now() / 1000);
    const expiresAtTimestamp = typeof token.expires_at === 'string' 
      ? parseInt(token.expires_at, 10)
      : typeof token.expires_at === 'number' 
        ? token.expires_at 
        : null;
    
    let accessToken = token.access_token;
    
    if (expiresAtTimestamp && expiresAtTimestamp < now) {
      console.log('🔄 Token expired, refreshing...');
      
      if (!token.refresh_token) {
        return NextResponse.json({ 
          error: 'Token expired and no refresh token available - please reconnect Gmail' 
        });
      }
      
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({
          access_token: token.access_token,
          refresh_token: token.refresh_token,
        });
        
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log('✅ Token refreshed successfully');
        
        // Update token in database
        if (credentials.access_token) {
          await supabase
            .from('user_tokens')
            .update({
              access_token: credentials.access_token,
              expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('provider', 'google');
          
          accessToken = credentials.access_token;
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        return NextResponse.json({ 
          error: 'Failed to refresh expired token - please reconnect Gmail',
          refreshError: refreshError instanceof Error ? refreshError.message : String(refreshError)
        });
      }
    } else {
      console.log('✅ Token is still valid');
    }
    
    // Set up Gmail API with valid token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    console.log('🔍 Fetching recent Gmail messages...');
    
    // Get recent messages without query (metadata scope limitation)
    console.log('🔍 Using basic message list (no query due to metadata scope)');
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20, // Get more since we can't filter
    });
    
    if (!listResponse.data.messages) {
      return NextResponse.json({ 
        message: 'No messages found',
        user: user.email
      });
    }
    
    console.log(`🔍 Found ${listResponse.data.messages.length} messages, fetching details...`);
    
    // Get details for first 5 messages
    const messages = [];
    for (let i = 0; i < Math.min(5, listResponse.data.messages.length); i++) {
      const msg = listResponse.data.messages[i];
      
      try {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata', // Use metadata format due to scope limitations
          metadataHeaders: ['Subject', 'From', 'To', 'Date']
        });
        
        const headers = fullMessage.data.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: any) => 
          h.name.toLowerCase() === name.toLowerCase())?.value || '';
        
        // Use snippet since we can't access full body with metadata scope
        const body = fullMessage.data.snippet || '';
        
        messages.push({
          id: msg.id,
          subject: getHeader('subject'),
          from: getHeader('from'),
          to: getHeader('to'),
          date: getHeader('date'),
          body: body,
          snippet: fullMessage.data.snippet,
          labelIds: fullMessage.data.labelIds || []
        });
        
      } catch (error) {
        console.error(`Error fetching message ${msg.id}:`, error);
        messages.push({
          id: msg.id,
          error: 'Failed to fetch details',
          errorMessage: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      user: user.email,
      totalFound: listResponse.data.messages.length,
      messagesRetrieved: messages.length,
      scopeNote: 'Using metadata scope - limited to headers and snippets only',
      messages: messages
    });
    
  } catch (error) {
    console.error('Debug Gmail error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
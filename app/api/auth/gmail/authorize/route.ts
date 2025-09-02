import { NextRequest, NextResponse } from 'next/server';
import { generateAuthUrl } from '@/server/google/client';

export async function GET(request: NextRequest) {
  try {
    // Get redirect parameter from query string
    const searchParams = request.nextUrl.searchParams;
    const redirect = searchParams.get('redirect') || '/dashboard';
    
    // Generate OAuth2 authorization URL using direct Next.js implementation
    const authUrl = generateAuthUrl({ 
      redirect,
      account_type: 'personal' 
    });
    
    console.log('🔄 Gmail authorization URL generated:', authUrl);
    
    // Redirect user to Google OAuth2 consent screen
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    console.error('❌ Gmail Authorization Error:', error);
    
    return NextResponse.json({
      error: 'Failed to initiate Gmail authorization',
      message: error instanceof Error ? error.message : 'Gmail authorization service unavailable'
    }, {
      status: 500,
    });
  }
}
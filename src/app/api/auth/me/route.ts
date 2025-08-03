import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth0';
import type { NextRequest } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await getSession(request as unknown as NextRequest);
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

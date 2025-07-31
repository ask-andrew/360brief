import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth0';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request as unknown as NextRequest);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

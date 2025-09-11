import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface AuthResult {
  success: true;
  user: {
    id: string;
    email: string;
  };
}

export interface AuthError {
  success: false;
  error: string;
  response: NextResponse;
}

/**
 * Centralized authentication utility for API routes.
 * Returns either authenticated user data or a properly formatted error response.
 */
export async function authenticateUser(): Promise<AuthResult | AuthError> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('🔐 Auth error:', userError.message);
      return {
        success: false,
        error: 'Authentication failed',
        response: NextResponse.json(
          { error: 'Authentication required', detail: userError.message }, 
          { status: 401 }
        )
      };
    }
    
    if (!user) {
      console.error('🔐 No user found in session');
      return {
        success: false,
        error: 'No user session',
        response: NextResponse.json(
          { error: 'Authentication required', detail: 'No user session found' }, 
          { status: 401 }
        )
      };
    }

    if (!user.email) {
      console.error('🔐 User missing email:', user.id);
      return {
        success: false,
        error: 'User missing email',
        response: NextResponse.json(
          { error: 'Invalid user data', detail: 'User email required' }, 
          { status: 400 }
        )
      };
    }

    console.log('✅ Authenticated user:', user.id, user.email);
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    };
    
  } catch (error) {
    console.error('🔐 Auth utility error:', error);
    return {
      success: false,
      error: 'Auth system error',
      response: NextResponse.json(
        { error: 'Authentication system error', detail: error instanceof Error ? error.message : 'Unknown error' }, 
        { status: 500 }
      )
    };
  }
}

/**
 * Higher-order function for wrapping API routes with authentication.
 * Usage: export const GET = withAuth(async (request, { user }) => { ... });
 */
export function withAuth<T extends any[]>(
  handler: (request: Request, context: { user: AuthResult['user'] }, ...args: T) => Promise<NextResponse>
) {
  return async (request: Request, ...args: T): Promise<NextResponse> => {
    const auth = await authenticateUser();
    
    if (!auth.success) {
      return auth.response;
    }
    
    return handler(request, { user: auth.user }, ...args);
  };
}
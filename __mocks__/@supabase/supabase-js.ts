import { SupabaseClient, AuthResponse, Session, User } from '@supabase/supabase-js';

// Define mock implementations with proper types
const mockSignInWithOAuth = jest.fn<Promise<AuthResponse>, any>();
const mockSignOut = jest.fn<Promise<{ error: Error | null }>, any>();
const mockGetSession = jest.fn<Promise<{ 
  data: { session: Session | null }, 
  error: Error | null 
}>, any>();
const mockOnAuthStateChange = jest.fn();

// Setup default mock implementations
mockGetSession.mockResolvedValue({ 
  data: { session: null }, 
  error: null 
});

// Mock the OAuth response with proper type
const createMockAuthResponse = (url: string): AuthResponse => ({
  data: { 
    user: null, 
    session: null
  },
  error: null,
  // @ts-ignore - Add url to the response for testing
  url
});

// Set up default mock implementation
mockSignInWithOAuth.mockImplementation(async () => 
  createMockAuthResponse('https://example.com/auth')
);

// Create the mock Supabase client
const mockSupabase = {
  auth: {
    signInWithOAuth: mockSignInWithOAuth as any,
    signOut: mockSignOut as any,
    getSession: mockGetSession as any,
    onAuthStateChange: mockOnAuthStateChange as any,
  },
} as unknown as SupabaseClient;

// Mock the createClient function
const createClient = jest.fn(() => mockSupabase);

// Export mocks for direct use in tests
export {
  createClient,
  mockSupabase,
  mockSignInWithOAuth,
  mockSignOut,
  mockGetSession,
  mockOnAuthStateChange,
};

export default {
  createClient,
};

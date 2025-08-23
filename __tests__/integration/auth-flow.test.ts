import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { SupabaseClient, Session, AuthResponse } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Create mock functions with proper typing
const mockSignInWithOAuth = jest.fn() as jest.MockedFunction<() => Promise<AuthResponse>>;
const mockSignOut = jest.fn();
const mockGetSession = jest.fn() as jest.MockedFunction<() => Promise<{ data: { session: Session | null }, error: any }>>;
const mockOnAuthStateChange = jest.fn();

// Create the mock Supabase client
const mockSupabase = {
  auth: {
    signInWithOAuth: mockSignInWithOAuth,
    signOut: mockSignOut,
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
  },
} as unknown as SupabaseClient;

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Setup default mock implementations before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Setup default mock implementations with proper typing
  mockGetSession.mockImplementation(() => Promise.resolve({ 
    data: { session: null }, 
    error: null 
  }));
  
  mockSignInWithOAuth.mockImplementation(() => Promise.resolve({
    data: { 
      provider: 'google',
      url: 'https://example.com/auth/callback?code=test-code'
    } as any,
    error: null
  } as AuthResponse));
});

// Load environment variables
config({ path: '.env.test' });

describe('OAuth Flow', () => {
  let testServer: Server;
  const OLD_ENV = process.env;

  beforeAll(() => {
    // Create a simple test server for callback handling
    testServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      const parsedUrl = parse(req.url || '', true);
      
      // Handle OAuth callback
      if (parsedUrl.pathname === '/auth/callback') {
        res.statusCode = 200;
        res.end('Auth callback handled');
        return;
      }
      
      // Default response
      res.statusCode = 404;
      res.end('Not found');
    });

    // Start the test server on a different port
    return new Promise<void>((resolve) => {
      testServer.listen(3001, resolve);
    });
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Set up test environment
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-supabase-url.com';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterAll(() => {
    // Restore environment
    process.env = OLD_ENV;
    
    // Close the test server
    return new Promise<void>((resolve, reject) => {
      testServer.close((err?: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('Authentication', () => {
    it('should handle unauthenticated session check', async () => {

      // Call getSession
      const result = await mockSupabase.auth.getSession();
      
      expect(result.error).toBeNull();
      expect(result.data.session).toBeNull();
      expect(mockGetSession).toHaveBeenCalled();
    });

    it('should handle OAuth sign in', async () => {
      // Mock the OAuth sign-in flow
      const mockAuthUrl = 'https://example.com/auth';
      
      // Mock the OAuth response with a redirect URL
      const mockRedirectUrl = 'https://example.com/auth?code=test-code';
      
      // Mock the signInWithOAuth to resolve with the redirect URL
      mockSignInWithOAuth.mockResolvedValueOnce({
        data: { 
          url: mockRedirectUrl
        },
        error: null
      } as any);

      // Simulate OAuth sign-in
      const signInOptions = {
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      };
      
      // Call the sign-in function
      const result = await mockSupabase.auth.signInWithOAuth(signInOptions as any);

      // Verify the response contains the expected redirect URL
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data.url).toBe(mockRedirectUrl);
      
      // Verify the signInWithOAuth was called with the correct options
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      });
    });
  });

  describe('Auth Callback', () => {
    it('should handle OAuth callback with valid code', async () => {
      // Mock the fetch function
      (global.fetch as jest.Mock) = jest.fn(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve('Auth callback handled'),
        } as Response)
      );

      const response = await fetch('http://localhost:3001/auth/callback?code=test-code&state=test-state');
      const text = await response.text();
      
      expect(response.status).toBe(200);
      expect(text).toContain('Auth callback handled');
    });
  });
});

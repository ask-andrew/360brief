// Import the test setup file
import './setupTests';

// Mock Next.js Router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => Promise.resolve()),
    };
  },
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  const mockAuth = () => ({
    signInWithOAuth: jest.fn(() => Promise.resolve({ data: { url: 'test-url' }, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    onAuthStateChange: jest.fn(),
  });

  return {
    createClient: jest.fn(() => ({
      auth: mockAuth(),
    })),
  };
});

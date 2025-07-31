// Add type declarations for global.gapi
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      gapi: any;
    }
  }
}

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  const mockClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    data: { user: { id: 'test-user-id' } },
  };

  return {
    createClient: jest.fn(() => mockClient),
  };
});

// Mock environment variables
process.env.SUPABASE_URL = 'https://mock-supabase-url.supabase.co';
process.env.SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';

// Mock Google APIs
global.gapi = {
  client: {
    init: jest.fn().mockResolvedValue({}),
    gmail: {
      users: {
        messages: {
          list: jest.fn().mockResolvedValue({ result: { messages: [] } }),
          get: jest.fn().mockResolvedValue({ result: {} }),
        },
      },
    },
    calendar: {
      events: {
        list: jest.fn().mockResolvedValue({ result: { items: [] } }),
      },
    },
  },
  auth2: {
    getAuthInstance: jest.fn().mockReturnValue({
      isSignedIn: {
        get: jest.fn().mockReturnValue(true),
      },
      currentUser: {
        get: jest.fn().mockReturnValue({
          getAuthResponse: jest.fn().mockReturnValue({
            access_token: 'mock-access-token',
          }),
        }),
      },
    }),
  },
} as any;

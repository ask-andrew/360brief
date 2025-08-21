'use client';

import { useGoogleOAuth } from '@/hooks/use-google-oauth';

export default function TestAuthPage() {
  const { startOAuthFlow, loading, error, resetError } = useGoogleOAuth({
    onSuccess: () => {
      console.log('OAuth flow completed successfully!');
    },
    onError: (error: Error) => {
      console.error('OAuth error:', error);
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Google OAuth Test</h1>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <button
            onClick={() => startOAuthFlow('/dashboard')}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" fill="currentColor"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <div className="font-medium">Error</div>
              <div className="mt-1">{error.message}</div>
              <button
                onClick={resetError}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Debug Info</h3>
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <div>Status: {loading ? 'Loading...' : 'Ready'}</div>
              <div>Environment: {process.env.NODE_ENV}</div>
              <div className="mt-4 text-xs bg-gray-50 p-2 rounded overflow-auto">
                <pre>{JSON.stringify({
                  windowLocation: typeof window !== 'undefined' ? window.location.origin : 'Not available',
                  env: {
                    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '***' : 'Not set',
                    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
                  }
                }, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

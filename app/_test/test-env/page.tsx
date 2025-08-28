export default function TestEnv() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <div className="space-y-4">
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}
        </div>
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}
        </div>
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Debug Info:</h2>
          <pre className="text-xs bg-black text-white p-4 rounded overflow-auto">
            {JSON.stringify({
              nodeEnv: process.env.NODE_ENV,
              nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '***REDACTED***' : undefined,
              nextPublicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***REDACTED***' : undefined,
              envKeys: Object.keys(process.env).filter(key => key.includes('NEXT_PUBLIC_'))
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

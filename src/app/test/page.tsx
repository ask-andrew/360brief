'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestPage() {
  const [status, setStatus] = useState('Connecting to Supabase...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Query a known table to verify connectivity
        setStatus('Querying database...');
        const { error: queryError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
          
        if (queryError) throw queryError;
        
        setStatus('✅ Successfully connected to Supabase!');
      } catch (err) {
        console.error('Connection test failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('❌ Connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-xl font-bold mb-4">Supabase Connection Test</h1>
        <div className="p-4 bg-gray-50 rounded">
          <p className="mb-2">Status: {status}</p>
          {error && (
            <p className="text-red-500">Error: {error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

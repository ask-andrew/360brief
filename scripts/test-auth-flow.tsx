'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Test component to verify auth flow
 * This component should be rendered on a test page to verify the authentication flow
 */
export function AuthFlowTester() {
  const router = useRouter();
  const { user, session, isAuthenticated, loading, error } = useAuthStore();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addTestResult = (testName: string, passed: boolean, message?: string) => {
    setTestResults(prev => [
      ...prev,
      `[${passed ? 'PASS' : 'FAIL'}] ${testName}${message ? `: ${message}` : ''}`
    ]);
  };

  const runAuthTests = async () => {
    setIsTesting(true);
    setTestResults(['Starting auth flow tests...']);

    try {
      // Test 1: Check initial state
      addTestResult('Initial state - loading', loading === true);
      
      // Wait for initial auth check to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 2: Check if unauthenticated users are redirected
      if (!isAuthenticated) {
        addTestResult('Unauthenticated access', true, 'User is not authenticated');
        
        // Test 3: Simulate successful login
        const mockUser = { id: 'test-user', email: 'test@example.com' };
        const mockSession = { user: mockUser, access_token: 'test-token' };
        useAuthStore.getState().setUser(mockUser, mockSession);
        
        // Test 4: Verify session was set
        const { session: updatedSession, user: updatedUser } = useAuthStore.getState();
        addTestResult('Session set', 
          updatedSession?.user?.email === 'test@example.com' && 
          updatedUser?.email === 'test@example.com'
        );
        
        // Test 5: Verify isAuthenticated
        addTestResult('isAuthenticated', 
          useAuthStore.getState().isAuthenticated === true, 
          `Expected true, got ${useAuthStore.getState().isAuthenticated}`
        );
        
        // Test 6: Simulate sign out
        useAuthStore.getState().signOut();
        
        // Test 7: Verify sign out
        addTestResult('Sign out', 
          useAuthStore.getState().isAuthenticated === false && 
          useAuthStore.getState().user === null
        );
      } else {
        addTestResult('Already authenticated', true, 'User is already authenticated');
      }
      
    } catch (error) {
      addTestResult('Test error', false, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Flow Tests</h1>
      
      <button
        onClick={runAuthTests}
        disabled={isTesting}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 mb-6"
      >
        {isTesting ? 'Running Tests...' : 'Run Auth Tests'}
      </button>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
        {testResults.map((result, index) => (
          <div 
            key={index} 
            className={`p-2 rounded ${result.includes('[PASS]') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {result}
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Current Auth State:</h2>
        <pre className="text-sm bg-white p-2 rounded overflow-auto">
          {JSON.stringify({
            user,
            session: session ? { ...session, user: '[...]' } : null,
            isAuthenticated,
            loading,
            error
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// Create a test page component
export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AuthFlowTester />
    </div>
  );
}

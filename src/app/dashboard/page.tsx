'use client';

import { useEffect, useState } from 'react';


type User = {
  name?: string;
  email?: string;
  picture?: string;
  sub: string;
};

export default function DashboardPage() {

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Not authenticated');
        }
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        // Use window.location for server-side redirect to avoid CORS issues
        window.location.href = '/api/auth/login';
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect will happen in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center space-x-6">
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt="User profile" 
                  className="h-24 w-24 rounded-full"
                />
              )}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Welcome, {user.name || 'User'}
                </h2>
                <p className="text-lg text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">User ID: {user.sub}</p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Executive Briefing</h3>
              <p className="mt-2 text-gray-600">
                Your personalized executive briefing will appear here once you connect your accounts.
              </p>
              
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/api/auth/logout'}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

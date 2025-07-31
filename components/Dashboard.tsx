import React, { useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import AnalyticsDashboard from './AnalyticsDashboard';

// 🔧 IMMEDIATE URL CAPTURE - before any routing can interfere
const captureInitialParams = () => {
  const params = new URLSearchParams(window.location.search);
  const googleConnected = params.get('google_connected');
  const error = params.get('error');
  
  console.log("🚀 IMMEDIATE CAPTURE - URL:", window.location.href);
  console.log("🚀 IMMEDIATE CAPTURE - google_connected:", googleConnected);
  
  if (googleConnected === 'true') {
    console.log("🚀 IMMEDIATE CAPTURE - Setting localStorage");
    localStorage.setItem('google_connected', 'true');
    localStorage.setItem('google_connected_timestamp', Date.now().toString());
  }
  
  if (error) {
    localStorage.setItem('google_connection_error', error);
  }
  
  return { googleConnected, error };
};

// Capture immediately when module loads
const initialParams = captureInitialParams();

const Dashboard = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [hasFetchedData, setHasFetchedData] = useState(false);
  const [briefData, setBriefData] = useState(null);
  const [error, setError] = useState(null);
  const [isFetchingBrief, setIsFetchingBrief] = useState(false);

  // Enhanced debug logging
  const logState = useCallback(() => {
    console.log("🔍 Dashboard State:", {
      isLoading,
      isAuthenticated,
      userSub: user?.sub,
      userEmail: user?.email,
      isGoogleConnected,
      hasFetchedData,
      isFetchingBrief,
      timestamp: new Date().toISOString()
    });
  }, [isLoading, isAuthenticated, user?.sub, user?.email, isGoogleConnected, hasFetchedData, isFetchingBrief]);

  // 1️⃣ Google Connected Detection (runs once on mount)
  useEffect(() => {
    console.log("🔍 Google Detection useEffect triggered");
    console.log("📍 Current URL:", window.location.href);
    console.log("📍 Search params:", window.location.search);
    console.log("📍 Initial params captured:", initialParams);
    
    // Check multiple sources for Google connection
    const sources = {
      urlParam: new URLSearchParams(window.location.search).get('google_connected'),
      initialCapture: initialParams.googleConnected,
      localStorage: localStorage.getItem('google_connected'),
      timestamp: localStorage.getItem('google_connected_timestamp')
    };
    
    console.log("📍 All Google connection sources:", sources);

    let googleConnected = false;
    let connectionSource = 'none';

    // Priority order: URL param -> initial capture -> localStorage
    if (sources.urlParam === 'true') {
      googleConnected = true;
      connectionSource = 'url_param';
      console.log("✅ Google connected via URL parameter");
      localStorage.setItem('google_connected', 'true');
      localStorage.setItem('google_connected_timestamp', Date.now().toString());
    } else if (sources.initialCapture === 'true') {
      googleConnected = true;
      connectionSource = 'initial_capture';
      console.log("✅ Google connected via initial capture");
    } else if (sources.localStorage === 'true') {
      // Check if localStorage connection is recent (within last 5 minutes)
      const timestamp = parseInt(sources.timestamp || '0');
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      if (timestamp > fiveMinutesAgo) {
        googleConnected = true;
        connectionSource = 'localStorage_recent';
        console.log("✅ Google connected via recent localStorage");
      } else {
        console.log("❌ localStorage connection too old, clearing");
        localStorage.removeItem('google_connected');
        localStorage.removeItem('google_connected_timestamp');
      }
    }

    console.log(`📍 Final decision: googleConnected=${googleConnected}, source=${connectionSource}`);
    setIsGoogleConnected(googleConnected);

    // Handle errors
    const errorParam = new URLSearchParams(window.location.search).get('error') || 
                      initialParams.error || 
                      localStorage.getItem('google_connection_error');
    
    if (errorParam) {
      setError(`Google connection failed: ${errorParam}`);
      console.error("⛔️ Google error:", errorParam);
      localStorage.removeItem('google_connection_error');
    }

    // Clean URL if it has parameters
    if (window.location.search) {
      console.log("🧹 Cleaning URL parameters");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // Only run once on mount

  // 2️⃣ Enhanced Brief Data Fetching with Retry Logic
  const fetchBriefData = useCallback(async () => {
    if (isFetchingBrief || hasFetchedData) {
      console.log("⏭️ Skipping fetch - already fetching or fetched");
      return;
    }

    console.log("🚀 Starting fetchBriefData...");
    setIsFetchingBrief(true);
    setError(null);

    try {
      const token = await getAccessTokenSilently();
      console.log("🔑 Got Auth0 token, calling get-brief-data...");
      
      const response = await fetch('/.netlify/functions/get-brief-data', {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': user.sub,
          'X-User-Email': user.email || '',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Brief data fetched successfully:", data);
      setBriefData(data);
      setHasFetchedData(true);
    } catch (err: any) {
      console.error("⛔️ Error fetching brief data:", err.message);
      setError(`Failed to fetch brief: ${err.message}`);
    } finally {
      setIsFetchingBrief(false);
    }
  }, [getAccessTokenSilently, user?.sub, user?.email, isFetchingBrief, hasFetchedData]);

  // 3️⃣ Trigger fetch when all conditions are met
  useEffect(() => {
    logState();

    // Wait for Auth0 to finish loading
    if (isLoading) {
      console.log("⏳ Auth0 still loading, waiting...");
      return;
    }

    // Check all required conditions
    if (!isAuthenticated) {
      console.log("❌ User not authenticated");
      return;
    }

    if (!user?.sub) {
      console.log("❌ User sub not available");
      return;
    }

    if (!isGoogleConnected) {
      console.log("❌ Google not connected");
      return;
    }

    if (hasFetchedData) {
      console.log("✅ Data already fetched");
      return;
    }

    console.log("🎯 All conditions met, triggering fetch...");
    fetchBriefData();
  }, [isLoading, isAuthenticated, user?.sub, isGoogleConnected, hasFetchedData, fetchBriefData, logState]);

  // 4️⃣ Manual retry function
  const handleRetryFetch = () => {
    console.log("🔄 Manual retry triggered");
    setHasFetchedData(false);
    setError(null);
  };

  // 5️⃣ Handle Google Connection
  const handleConnectGoogle = async () => {
    console.log("🔗 Initiating Google connection...");
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('/.netlify/functions/connect-google', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': user.sub,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get Google auth URL: ${response.statusText}`);
      }

      const { authUrl } = await response.json();
      console.log("🔗 Redirecting to Google OAuth...");
      window.location.href = authUrl;
    } catch (err: any) {
      console.error("⛔️ Error connecting to Google:", err);
      setError(`Failed to connect to Google: ${err.message}`);
    }
  };

  // 6️⃣ Loading state while Auth0 initializes
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-blue mx-auto mb-4"></div>
          <p className="text-white">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // 7️⃣ Main UI
  return (
    <div className="min-h-screen bg-brand-dark text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Welcome, {user?.name || user?.email}</h1>

        {/* Connection Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          
          {!isGoogleConnected ? (
            <div>
              <p className="text-yellow-400 mb-4">📧 Connect your Google account to get started</p>
              <button
                onClick={handleConnectGoogle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Connect Google Account
              </button>
            </div>
          ) : (
            <div>
              <p className="text-green-400 mb-2">✅ Google Account Connected</p>
              <p className="text-sm text-gray-400">Email: {user?.email}</p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <p className="text-red-300">{error}</p>
            {isGoogleConnected && (
              <button
                onClick={handleRetryFetch}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Brief Data or Loading */}
        {isGoogleConnected && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📬 Your Email Brief</h2>
            
            {isFetchingBrief ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Analyzing your emails...</p>
              </div>
            ) : briefData ? (
              <div className="space-y-4">
                <AnalyticsDashboard data={briefData} />
                <button
                  onClick={handleRetryFetch}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Refresh Brief
                </button>
              </div>
            ) : !isFetchingBrief && !error && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Ready to fetch your brief</p>
                <button
                  onClick={handleRetryFetch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Generate Brief
                </button>
              </div>
            )}
          </div>
        )}

        {/* Debug Info (remove in production) */}
        <details className="mt-6 bg-gray-900 rounded p-4">
          <summary className="text-gray-400 cursor-pointer">Debug Info</summary>
          <pre className="text-xs text-gray-500 mt-2">
            {JSON.stringify({
              isLoading,
              isAuthenticated,
              userSub: user?.sub,
              userEmail: user?.email,
              isGoogleConnected,
              hasFetchedData,
              isFetchingBrief,
            }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default Dashboard;

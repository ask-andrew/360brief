import React, { useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProblemSolution from './components/ProblemSolution';
import HowItWorks from './components/HowItWorks';
import FutureFeatures from './components/FutureFeatures';
import Benefits from './components/Benefits';
import AudioBrief from './components/AudioBrief';
import ProductivityCalculator from './components/ProductivityCalculator';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import { useAuth0, Auth0Provider } from '@auth0/auth0-react'; // Import Auth0Provider
import Dashboard from './components/Dashboard';
import BriefingStyles from './components/BriefingStyles';
import { auth0Config } from './config'; // Assuming config is correctly imported

const App: React.FC = () => {
  const { isAuthenticated, isLoading, user, error, loginWithRedirect } = useAuth0();

  // Debug Auth0 state
  console.log(" App.tsx Auth0 State:", {
    isLoading,
    isAuthenticated,
    userSub: user?.sub,
    userEmail: user?.email,
    error: error?.message,
    currentUrl: window.location.href,
    timestamp: new Date().toISOString()
  });

  // Handle Google OAuth return when Auth0 session is lost
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleConnected = urlParams.get('google_connected');
    
    // If Google OAuth completed but Auth0 session is lost, re-authenticate
    if (googleConnected === 'true' && !isLoading && !isAuthenticated) {
      console.log(" Google OAuth completed but Auth0 session lost. Re-authenticating...");
      
      // Clean the URL first to avoid redirect loops
      window.history.replaceState({}, document.title, '/dashboard');
      
      // Trigger Auth0 login
      loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin + '/dashboard'
        }
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading) {
    console.log(" Auth0 is loading...");
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-blue"></div>
      </div>
    );
  }

  if (error) {
    console.error(" Auth0 Error:", error);
  }

  console.log(` Rendering: ${isAuthenticated ? 'Dashboard' : 'Home Page'}`);

  return (
    <div className="min-h-screen bg-brand-dark overflow-x-hidden">
      <Header />
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <>
          <main className="container mx-auto px-6 md:px-12">
            <Hero />
            <ProblemSolution />
            <HowItWorks />
            <BriefingStyles />
            <Benefits />
            <ProductivityCalculator />
            <AudioBrief />
            <FutureFeatures />
            <CallToAction />
          </main>
          <Footer />
        </>
      )}
    </div>
  );
};

// This wrapper is needed because useAuth0 can only be called inside Auth0Provider
const RootApp: React.FC = () => {
  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: "openid profile email", // <--- ADDED/ENSURED THIS SCOPE
      }}
    >
      <App />
    </Auth0Provider>
  );
};

export default RootApp; // Export RootApp which wraps App with Auth0Provider

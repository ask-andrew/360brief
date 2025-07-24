import React from 'react';
import Logo from './Logo';
import { useAuth0 } from '@auth0/auth0-react';
import { GoogleLoginIcon, SlackIcon, MicrosoftIcon } from './Icons';

const Header: React.FC = () => {
  const {
    loginWithRedirect,
    logout,
    user,
    isAuthenticated,
    isLoading
  } = useAuth0();

  const handleLogin = (connection: 'google-oauth2' | 'slack' | 'windowslive') => {
    loginWithRedirect({
      appState: { returnTo: window.location.pathname },
      authorizationParams: {
        connection: connection,
      }
    });
  };

  return (
    <header className="py-4 px-6 md:px-12 sticky top-0 z-50 bg-brand-dark/80 backdrop-blur-lg border-b border-slate-800">
      <div className="container mx-auto flex justify-between items-center">
        <a href="#" className="flex items-center gap-3 text-2xl font-bold text-white">
          <Logo className="h-8 w-8" />
          <span>360<span className="text-brand-blue">Brief</span></span>
        </a>
        <div className="flex items-center gap-4">
          {isLoading && (
            <div className="w-40 h-9 bg-slate-700 rounded-lg animate-pulse"></div>
          )}

          {!isLoading && !isAuthenticated && (
            <>
              <div className="hidden items-center gap-2">
                {/*
                <button
                  onClick={() => handleLogin('google-oauth2')}
                  className="flex items-center justify-center gap-2 bg-slate-800 text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-slate-700 hover:text-white transition-colors duration-300 text-sm"
                  aria-label="Continue with Google"
                >
                  <GoogleLoginIcon className="w-5 h-5" />
                  <span>Google</span>
                </button>
                */}
                <button
                  onClick={() => handleLogin('slack')}
                  className="flex items-center justify-center gap-2 bg-slate-800 text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-slate-700 hover:text-white transition-colors duration-300 text-sm"
                  aria-label="Continue with Slack"
                >
                  <SlackIcon className="w-5 h-5" />
                  <span>Slack</span>
                </button>
                 <button
                  onClick={() => handleLogin('windowslive')}
                  className="flex items-center justify-center gap-2 bg-slate-800 text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-slate-700 hover:text-white transition-colors duration-300 text-sm"
                  aria-label="Continue with Microsoft"
                >
                  <MicrosoftIcon className="w-5 h-5" />
                  <span>Microsoft</span>
                </button>
              </div>
               <button
                onClick={() => loginWithRedirect()}
                className="text-slate-300 hover:text-white font-medium transition-colors duration-300 text-sm"
                aria-label="Log in to your account"
              >
                Log In
              </button>
              <a
                href="#join-waitlist"
                className="bg-brand-blue text-white font-semibold py-2 px-5 rounded-lg hover:bg-sky-400 transition-colors duration-300 text-sm md:text-base"
              >
                Join Waitlist
              </a>
            </>
          )}

          {!isLoading && isAuthenticated && user && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="text-slate-300 hover:text-white font-medium transition-colors duration-300 text-sm md:text-base"
              >
                Log Out
              </button>
              <img
                src={user.picture}
                alt={user.name ?? 'User avatar'}
                className="h-9 w-9 rounded-full border-2 border-slate-600 hover:opacity-90 transition-opacity"
                title={`Logged in as ${user.name}`}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
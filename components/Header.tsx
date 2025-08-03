import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { GoogleLoginIcon, MicrosoftIcon, SlackIcon } from '@/components/ui/icons';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamically import the Logo component to avoid SSR issues with Next.js
const Logo = dynamic(() => import('./Logo'), { ssr: false });

const Header: React.FC = () => {
  const { user, isLoading } = useUser();
  const isAuthenticated = !!user;

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
              <div className="flex items-center gap-2">
                <Link 
                  href="/api/auth/login?connection=google-oauth2"
                  className="flex items-center justify-center gap-2 bg-slate-800 text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-slate-700 hover:text-white transition-colors duration-300 text-sm"
                  aria-label="Continue with Google"
                >
                  <GoogleLoginIcon className="w-5 h-5" />
                  <span>Google</span>
                </Link>
                <Link 
                  href="/api/auth/login?connection=slack"
                  className="flex items-center justify-center gap-2 bg-slate-800 text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-slate-700 hover:text-white transition-colors duration-300 text-sm"
                  aria-label="Continue with Slack"
                >
                  <SlackIcon className="w-5 h-5" />
                  <span>Slack</span>
                </Link>
                <Link 
                  href="/api/auth/login?connection=windowslive"
                  className="flex items-center justify-center gap-2 bg-slate-800 text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-slate-700 hover:text-white transition-colors duration-300 text-sm"
                  aria-label="Continue with Microsoft"
                >
                  <MicrosoftIcon className="w-5 h-5" />
                  <span>Microsoft</span>
                </Link>
              </div>
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
              <Link
                href="/api/auth/logout"
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300"
              >
                Log Out
              </Link>
              {user.picture && (
                <Image
                  src={user.picture}
                  alt={user.name ?? 'User avatar'}
                  className="w-8 h-8 rounded-full"
                  width={32}
                  height={32}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
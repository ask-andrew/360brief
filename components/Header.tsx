
import React from 'react';
import { LogoIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="py-4 px-6 md:px-12 sticky top-0 z-50 bg-brand-dark/80 backdrop-blur-lg border-b border-slate-800">
      <div className="container mx-auto flex justify-between items-center">
        <a href="#" className="flex items-center gap-3 text-2xl font-bold text-white">
          <LogoIcon className="h-8 w-8 text-brand-blue" />
          <span>360<span className="text-brand-blue">Brief</span></span>
        </a>
        <a
          href="#join-waitlist"
          className="bg-brand-blue text-white font-semibold py-2 px-5 rounded-lg hover:bg-sky-400 transition-colors duration-300 text-sm md:text-base"
        >
          Join Waitlist
        </a>
      </div>
    </header>
  );
};

export default Header;
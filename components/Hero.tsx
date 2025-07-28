// src/components/Hero.tsx
import React from 'react';
import Logo from './Logo';
import { useAuth0 } from '@auth0/auth0-react'; // Import useAuth0

const Hero: React.FC = () => {
  const { loginWithRedirect } = useAuth0(); // Destructure loginWithRedirect

  const handleGetStarted = () => {
    // This will redirect the user to your Auth0 Universal Login page
    loginWithRedirect();
  };

  return (
    <section className="text-center pt-20 md:pt-24 pb-12 md:pb-16">
      <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <Logo className="w-auto h-40 md:h-48 mx-auto rounded-2xl shadow-2xl shadow-black/30" />
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        Stop Drowning in Noise.
        <br />
        Start Finding Signals.
      </h1>
      <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        360Brief connects your communication tools and uses AI to generate your daily executive summary. Save time, reduce tool fatigue, and focus on what truly matters.
      </p>
      <div className="mt-10 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        {/* Changed from <a> tag to <button> for Auth0 login */}
        <button
          onClick={handleGetStarted} // This calls Auth0's login function
          className="bg-brand-blue text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-sky-400 transition-all duration-300 shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 transform hover:-translate-y-1"
        >
          Get Started - It's Free! {/* Updated text for clarity */}
        </button>
      </div>
    </section>
  );
};

export default Hero;
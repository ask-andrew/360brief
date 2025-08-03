// src/components/Hero.tsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { RocketIcon, ZapIcon, ClockIcon } from './Icons';

const Hero: React.FC = () => {
  const { loginWithRedirect } = useAuth0();

  const handleGetStarted = () => {
    loginWithRedirect({
      appState: { returnTo: '/dashboard' }
    });
  };

  const handleWatchDemo = () => {
    // TODO: Implement video modal
    console.log('Watch demo clicked');
  };

  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-brand-dark to-slate-900 opacity-90">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5"></div>
      </div>
      
      <div className="container mx-auto px-6 md:px-12 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center bg-brand-blue/10 text-brand-blue text-sm font-medium px-4 py-1.5 rounded-full mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <RocketIcon className="w-4 h-4 mr-2" />
              Now with AI-powered insights
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-sky-100 to-brand-blue">
                Executive Time,<br />
                <span className="text-brand-blue">Reclaimed</span>
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              Transform hours of meetings and emails into a 5-minute executive brief.<br />
              <span className="font-medium text-white">Get back 10+ hours every week.</span>
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <button
                onClick={handleGetStarted}
                className="group relative bg-brand-blue text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-sky-400 transition-all duration-300 shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                <ZapIcon className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Start Free Trial - No Credit Card
              </button>
              <button
                onClick={handleWatchDemo}
                className="bg-transparent border-2 border-slate-600 text-white font-medium py-4 px-8 rounded-lg text-lg hover:bg-slate-800/50 transition-all duration-300 flex items-center justify-center group"
              >
                <svg className="w-5 h-5 mr-2 text-brand-blue group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Demo
              </button>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-8 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center text-slate-400 text-sm mb-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800"></div>
                  ))}
                </div>
                <span className="ml-3">Trusted by 1,000+ executives</span>
              </div>
              <div className="flex items-center text-slate-500 text-sm">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>Set up in under 2 minutes</span>
              </div>
            </div>
          </div>
          
          {/* Hero Image/Animation */}
          <div className="relative mt-16 md:mt-24 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue/20 to-sky-400/20 rounded-2xl blur-2xl -z-10"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="p-1">
                  <div className="h-96 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-5xl mb-4">📊</div>
                      <h3 className="text-xl font-bold text-white mb-2">Your Executive Dashboard</h3>
                      <p className="text-slate-400">See your daily brief, key metrics, and action items at a glance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
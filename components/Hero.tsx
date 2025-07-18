import React from 'react';

const Hero: React.FC = () => {
  // The full logo is displayed prominently in the hero section.
  // It's embedded as a data URL to be self-contained within the component.
  const logoDataUrl = 'data:image/jpeg;base64,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';

  return (
    <section className="text-center pt-20 md:pt-24 pb-12 md:pb-16">
      <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <img src={logoDataUrl} alt="360Brief Logo" className="w-auto h-40 md:h-48 mx-auto rounded-2xl shadow-2xl shadow-black/30" />
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
        <a
          href="#join-waitlist"
          className="bg-brand-blue text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-sky-400 transition-all duration-300 shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 transform hover:-translate-y-1"
        >
          Get Early Access
        </a>
      </div>
    </section>
  );
};

export default Hero;
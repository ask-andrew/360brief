import React from 'react';
import { ArrowRightIcon, CheckCircleIcon, ShieldCheckIcon, LightningBoltIcon } from './Icons';

const CallToAction: React.FC = () => {
  const features = [
    '14-day free trial',
    'No credit card required',
    'Cancel anytime',
    '30-day money-back guarantee'
  ];
  
  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-center [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
      </div>
      
      <div className="container mx-auto px-6 md:px-12 relative">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700/50 mb-6">
            <LightningBoltIcon className="w-5 h-5 text-brand-blue mr-2" />
            <span className="text-sm font-medium text-brand-blue">Ready to transform your workflow?</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Reclaim Hours of Your Day
          </h2>
          
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10">
            Join thousands of executives who are already saving 10+ hours per week with 360Brief's AI-powered executive briefing platform.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-brand-blue to-sky-500 hover:from-brand-blue/90 hover:to-sky-500/90 rounded-xl shadow-lg shadow-brand-blue/20 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRightIcon className="ml-2 w-5 h-5" />
            </a>
            
            <a
              href="#demo"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all duration-300"
            >
              Watch Demo
            </a>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800"></div>
                ))}
              </div>
              <span className="ml-3 text-sm text-slate-400">
                Trusted by <span className="font-semibold text-white">1,000+</span> executives
              </span>
            </div>
            
            <div className="h-6 w-px bg-slate-700"></div>
            
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
              <span className="ml-3 text-sm text-slate-400">
                <span className="font-semibold text-white">SOC 2</span> Compliant
              </span>
            </div>
          </div>
          
          {/* Feature list */}
          <div className="inline-grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-brand-blue mr-2 flex-shrink-0" />
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Netlify Form (hidden by default) */}
        <div className="hidden">
          <form name="waitlist" method="POST" data-netlify="true" data-netlify-honeypot="bot-field">
            <input type="hidden" name="form-name" value="waitlist" />
            <div hidden aria-hidden="true">
              <label>Don't fill this out if you're human: <input name="bot-field" /></label>
            </div>
            <input type="email" name="email" />
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
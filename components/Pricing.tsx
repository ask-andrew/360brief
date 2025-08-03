import React from 'react';
import { CheckIcon, ZapIcon } from './Icons';

type PricingTier = {
  name: string;
  price: string;
  description: string;
  popular?: boolean;
  cta: string;
  features: string[];
  highlight?: boolean;
};

const Pricing: React.FC = () => {
  const pricingTiers: PricingTier[] = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for individuals getting started',
      cta: 'Get Started',
      features: [
        '1 connected email account',
        'Basic email summarization',
        'Daily briefings',
        '7-day message history',
        'Basic support',
      ],
    },
    {
      name: 'Professional',
      price: '$29',
      description: 'For professionals who need more power',
      popular: true,
      cta: 'Start Free Trial',
      features: [
        '3 connected accounts',
        'Advanced AI summarization',
        'Priority email & calendar',
        'Unlimited message history',
        'Priority support',
        'Custom briefing times',
        'Basic analytics',
      ],
      highlight: true,
    },
    {
      name: 'Executive',
      price: '$79',
      description: 'For executives and teams',
      cta: 'Contact Sales',
      features: [
        'Unlimited connected accounts',
        'Advanced AI + human review',
        'Team collaboration features',
        'Custom integrations',
        '24/7 priority support',
        'Custom analytics dashboard',
        'Dedicated account manager',
      ],
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Start with our free plan and upgrade as your needs grow
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => (
            <div 
              key={tier.name}
              className={`relative rounded-2xl overflow-hidden border ${
                tier.highlight 
                  ? 'border-brand-blue/50 bg-gradient-to-br from-slate-800/50 to-slate-900/80' 
                  : 'border-slate-700/50 bg-slate-800/30'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-brand-blue to-sky-500 text-white text-xs font-semibold px-4 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}
              
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-1">{tier.name}</h3>
                  <p className="text-slate-400">{tier.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                    <span className="ml-2 text-slate-400">
                      {tier.price !== 'Free' ? '/month' : 'forever'}
                    </span>
                  </div>
                  {tier.price !== 'Free' && (
                    <p className="text-sm text-slate-500 mt-1">
                      Billed annually or ${parseInt(tier.price.replace('$', '')) * 1.2}/month
                    </p>
                  )}
                </div>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 mb-8 ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-brand-blue to-sky-500 text-white hover:opacity-90 shadow-lg shadow-brand-blue/20'
                      : 'bg-slate-700/50 text-white hover:bg-slate-700/70 border border-slate-600/50'
                  }`}
                >
                  {tier.cta}
                </button>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    What's included:
                  </h4>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={tier.features.indexOf(feature)} className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5 mr-2" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center bg-slate-800/50 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-700/50">
            <ZapIcon className="w-5 h-5 text-brand-blue mr-2" />
            <p className="text-slate-300">
              All plans include a <span className="text-white font-semibold">14-day free trial</span> of Professional
            </p>
          </div>
          
          <p className="mt-6 text-slate-500 text-sm">
            Need something custom?{' '}
            <a href="#contact" className="text-brand-blue hover:underline">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

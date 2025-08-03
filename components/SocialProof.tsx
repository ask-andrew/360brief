import React, { useState, useEffect } from 'react';
import { QuoteIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

type Testimonial = {
  id: number;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
};

const SocialProof: React.FC = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      quote: "360Brief has transformed how I start my day. What used to take me 2 hours of email triage now takes 15 minutes with clear action items highlighted.",
      author: "Sarah Chen",
      role: "VP of Operations",
      company: "TechStart Inc.",
      avatar: "/images/avatars/avatar1.svg"
    },
    {
      id: 2,
      quote: "The AI-powered insights have helped me identify team bottlenecks weeks before they became critical issues. It's like having an extra set of eyes on my business.",
      author: "Michael Rodriguez",
      role: "CEO",
      company: "GrowthLabs",
      avatar: "/images/avatars/avatar2.svg"
    },
    {
      id: 3,
      quote: "As a busy executive, I need to stay on top of everything without getting lost in the weeds. 360Brief gives me exactly that - the signal through the noise.",
      author: "Priya Patel",
      role: "Head of Product",
      company: "Nexus Solutions",
      avatar: "/images/avatars/avatar3.svg"
    }
  ];

  const clientLogos = [
    { name: 'TechCorp', logo: '/images/clients/techcorp.svg' },
    { name: 'InnoVentures', logo: '/images/clients/innoventures.svg' },
    { name: 'CloudScale', logo: '/images/clients/cloudscale.svg' },
    { name: 'DataDyne', logo: '/images/clients/datadyne.svg' },
    { name: 'NexusLabs', logo: '/images/clients/nexuslabs.svg' },
  ];

  const trustBadges = [
    { name: 'SOC 2 Compliant', icon: '🛡️' },
    { name: 'GDPR Compliant', icon: '🔒' },
    { name: '256-bit Encryption', icon: '🔑' },
    { name: '99.9% Uptime', icon: '⚡' },
  ];

  // Auto-advance testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setTimeout(() => {
      setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    }, 6000);

    return () => clearTimeout(timer);
  }, [activeTestimonial, isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    setIsAutoPlaying(false);
  };

  return (
    <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 relative">
        {/* Testimonials */}
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Executives
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Join thousands of leaders who have transformed their workflow with 360Brief
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-24">
          <div className="relative">
            {/* Testimonial Navigation */}
            <button 
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 p-2 text-slate-500 hover:text-white transition-colors z-10"
              aria-label="Previous testimonial"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>

            {/* Testimonial Content */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-slate-700/50">
              <div className="flex flex-col items-center text-center">
                <QuoteIcon className="w-10 h-10 text-brand-blue/30 mb-6" />
                <blockquote className="text-xl md:text-2xl font-medium text-white mb-8 max-w-3xl">
                  "{testimonials[activeTestimonial].quote}"
                </blockquote>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-2xl">
                    {testimonials[activeTestimonial].avatar ? (
                      <img 
                        src={testimonials[activeTestimonial].avatar} 
                        alt={testimonials[activeTestimonial].author}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{testimonials[activeTestimonial].author.charAt(0)}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">{testimonials[activeTestimonial].author}</p>
                    <p className="text-sm text-slate-400">
                      {testimonials[activeTestimonial].role}, {testimonials[activeTestimonial].company}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Testimonial Dots */}
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveTestimonial(index);
                      setIsAutoPlaying(false);
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === activeTestimonial ? 'bg-brand-blue w-6' : 'bg-slate-700'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 p-2 text-slate-500 hover:text-white transition-colors z-10"
              aria-label="Next testimonial"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Client Logos */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <p className="text-slate-400 mb-6">TRUSTED BY INNOVATIVE COMPANIES</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-80 hover:opacity-100 transition-opacity">
              {clientLogos.map((client, index) => (
                <div key={index} className="h-8 flex items-center grayscale hover:grayscale-0 transition-all">
                  <span className="text-white text-lg font-medium">{client.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => (
              <div 
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 text-center border border-slate-700/50 hover:border-brand-blue/30 transition-all"
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <p className="text-sm font-medium text-slate-300">{badge.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;

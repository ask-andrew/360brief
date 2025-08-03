import React, { useState, useEffect } from 'react';
import { QuoteIcon } from './Icons';

interface Testimonial {
  id: number;
  quote: string;
  source: string;
  role?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "Nearly 90% of meeting participants admit to daydreaming during meetings.",
    source: "Harvard Business Review"
  },
  {
    id: 2,
    quote: "Executives spend an average of 23 hours per week in meetings, with 71% considering them unproductive.",
    source: "Harvard Business Review"
  },
  {
    id: 3,
    quote: "360Brief saved me 10+ hours a week by cutting through the noise and showing me only what matters.",
    source: "Sarah K.",
    role: "VP of Operations, Tech Startup"
  },
  {
    id: 4,
    quote: "The daily digest helps me stay on top of critical issues without drowning in emails and Slack threads.",
    source: "Michael T.",
    role: "Head of Product"
  }
];

const TestimonialCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate testimonials every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPaused]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex => (prevIndex - 1 + testimonials.length) % testimonials.length));
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 bg-slate-900/50">
      <div className="container mx-auto px-6 md:px-12">
        <div 
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Quote Icon */}
          <div className="text-brand-blue/20 absolute -top-2 -left-4 md:-left-8">
            <QuoteIcon className="w-16 h-16 md:w-24 md:h-24" />
          </div>
          
          {/* Testimonial Content */}
          <div className="relative z-10">
            <blockquote className="text-xl md:text-2xl text-slate-200 font-medium leading-relaxed mb-6">
              {currentTestimonial.quote}
            </blockquote>
            <div className="text-right">
              <p className="text-brand-blue font-semibold">{currentTestimonial.source}</p>
              {currentTestimonial.role && (
                <p className="text-slate-400 text-sm">{currentTestimonial.role}</p>
              )}
            </div>
          </div>
          
          {/* Navigation Dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-brand-blue w-6' : 'bg-slate-700 hover:bg-slate-600'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Previous testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Next testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialCarousel;

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, ChevronRight, Shield } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-background/95">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 to-transparent" />
      
      <div className="container relative py-20 md:py-32 lg:py-40">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="flex flex-col items-center gap-4 mb-6 sm:flex-row sm:justify-center">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
              🚀 Now in beta — early access
            </div>
            <Link 
              href="/security" 
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Shield className="mr-1.5 h-4 w-4 text-primary" />
              Security & Privacy
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          
          {/* Main heading */}
          <h1 className="text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
            One Brief. Total Clarity.
          </h1>
          
          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground font-medium">
            Consolidate. Prioritize. Act—in minutes, not hours.
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link 
              href="/signup"
              className={cn(
                'group inline-flex items-center justify-center rounded-xl bg-primary px-8 py-6 text-lg font-semibold text-primary-foreground',
                'transition-all hover:bg-primary/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'hover:shadow-primary/20 hover:scale-[1.02] transform transition-transform',
                'shadow-[0_4px_14px_0_rgba(0,0,0,0.08)]'
              )}
            >
              Get Your First Briefing Free
              <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <Link
              href="#how-it-works"
              className={cn(
                'group inline-flex items-center justify-center rounded-xl border border-input bg-background px-8 py-6 text-lg font-medium',
                'transition-all hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'hover:shadow-md transform transition-transform hover:scale-[1.02]'
              )}
            >
              See How It Works
            </Link>
          </div>
          
          {/* Trust indicators intentionally removed for early launch authenticity */}
        </div>
      </div>
    </section>
  );
}

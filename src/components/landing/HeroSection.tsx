import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, ChevronRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-background/95">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 to-transparent" />
      
      <div className="container relative py-20 md:py-32 lg:py-40">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
            🚀 Now in Early Access
          </div>
          
          {/* Main heading */}
          <h1 className="text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
            Executive Briefings,<br />Not Email Overload
          </h1>
          
          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            360°Brief transforms your communication chaos into clear, actionable insights—so you can focus on leading, not sifting through your inbox.
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link 
              href="/signup"
              className={cn(
                'group inline-flex items-center justify-center rounded-lg bg-primary px-8 py-6 text-base font-semibold text-primary-foreground',
                'transition-all hover:bg-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'hover:shadow-primary/20'
              )}
            >
              Get Started Free
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <Link
              href="#how-it-works"
              className={cn(
                'inline-flex items-center justify-center rounded-lg border border-input bg-background px-8 py-6 text-base font-medium',
                'transition-colors hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              See How It Works
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-10">
            <p className="text-sm text-muted-foreground">
              Trusted by executives from
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-8 opacity-70">
              {['Google', 'Microsoft', 'Slack', 'Notion', 'Figma'].map((company) => (
                <div key={company} className="text-muted-foreground">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Hero image/illustration */}
        <div className="relative mt-20 h-[400px] overflow-hidden rounded-2xl border bg-background/50 shadow-xl backdrop-blur-sm">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl">📊</div>
              <p className="mt-2 text-muted-foreground">Dashboard Preview</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

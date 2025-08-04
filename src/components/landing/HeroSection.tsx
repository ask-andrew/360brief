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
            🚀 Trusted by executives at fast-growing companies
          </div>
          
          {/* Main heading */}
          <h1 className="text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
            Your Time, Multiplied
          </h1>
          
          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground font-medium">
            360Brief transforms hours of emails, meetings, and messages into a <span className="text-primary font-semibold">5-minute executive briefing</span>—so you can focus on what truly matters.
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
          
          {/* Trust indicators */}
          <div className="mt-10">
            <p className="text-sm text-muted-foreground">
              Trusted by executives from
            </p>
            {/* Social proof */}
            <div className="mt-16 w-full max-w-2xl mx-auto">
              <div className="relative">
                <div className="flex -space-x-3">
                  {[
                    { name: 'Sarah K.', role: 'VP Operations', company: 'TechScale' },
                    { name: 'Michael R.', role: 'CEO', company: 'GrowthHarbor' },
                    { name: 'Priya M.', role: 'Head of Product', company: 'NovaLabs' },
                    { name: 'David T.', role: 'CTO', company: 'InnoVentures' },
                    { name: 'Elena G.', role: 'COO', company: 'Stratagem' },
                  ].map((user, i) => (
                    <div 
                      key={i}
                      className="relative group"
                      data-tooltip={`${user.name} • ${user.role} at ${user.company}`}
                    >
                      <div className="h-12 w-12 rounded-full border-2 border-background bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-medium text-foreground overflow-hidden">
                        <span className="bg-primary/5 backdrop-blur-sm w-full h-full flex items-center justify-center">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full h-4 w-4 border-2 border-background"></div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Join 100+ executives who save <span className="font-semibold text-foreground">5+ hours weekly</span> with 360Brief</p>
                </div>
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
      </div>
    </section>
  );
}

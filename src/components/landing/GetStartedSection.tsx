import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight, PlayCircle } from 'lucide-react';

export function GetStartedSection() {
  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-background to-muted/10">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 opacity-10 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
        <div className="h-[1000px] w-full [background-image:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>
      </div>
      
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center justify-center px-6 py-2.5 mb-6 text-sm font-medium rounded-full border border-primary/20 bg-primary/10 text-primary backdrop-blur-sm">
            🚀 Start your executive productivity journey today
          </div>
          
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Reclaim Your Most Valuable Asset: Time
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Join forward-thinking executives who've already transformed their workflow. Get your first executive briefing in minutes—no credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
            <Button 
              size="lg" 
              className="px-10 py-7 text-lg font-semibold group transition-all duration-200 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02]"
              asChild
            >
              <Link href="/signup" className="flex items-center gap-2">
                Get Started Free
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-10 py-7 text-lg font-medium group transition-all duration-200 hover:scale-[1.02]" 
              asChild
            >
              <Link href="/demo" className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Watch Demo
              </Link>
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Lightning Fast Setup',
                description: 'Connect your accounts and get your first digest in under 5 minutes.'
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Enterprise-Grade Security',
                description: 'Your data is encrypted and never stored longer than necessary.'
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'AI-Powered Insights',
                description: 'Get the key information you need, when you need it, without the noise.'
              }
            ].map((feature, index) => (
              <div key={index} className="p-6 bg-card rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 pt-8 border-t border-border/50">
            <p className="text-muted-foreground mb-6">Trusted by executives at leading companies</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
              {['TechCorp', 'InnoVate', 'GlobalX', 'NextGen', 'EliteGroup'].map((company, i) => (
                <div key={i} className="text-xl font-medium text-muted-foreground/80">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

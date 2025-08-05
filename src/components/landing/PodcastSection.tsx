import Image from 'next/image';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PodcastSection() {
  return (
    <section className="py-20 bg-muted/20">
      <div className="container px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 text-sm font-medium rounded-full border border-primary/20 bg-primary/10 text-primary">
              On-the-Go Briefings
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Listen to Your Briefing Anywhere
            </h2>
            
            <p className="text-lg text-muted-foreground">
              Turn your commute, workout, or coffee break into productive time with our podcast-style briefings. 
              Get the same executive summary in an audio format that fits your busy schedule.
            </p>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="text-foreground">Perfect for your morning routine or commute</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="text-foreground">Hands-free consumption of your daily priorities</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="text-foreground">Available on all major podcast platforms</span>
              </li>
            </ul>
            
            <div className="pt-4 flex flex-wrap gap-4">
              <Button className="gap-2" size="lg">
                <Play className="h-4 w-4" />
                Play Sample
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
          
          {/* Right column - Phone image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xs">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl -z-10 blur-xl"></div>
              <Image
                src="/images/podcast-phone.svg"
                alt="360Brief podcast player on mobile"
                width={300}
                height={600}
                className="w-full h-auto drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

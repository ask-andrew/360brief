import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PodcastSection } from '@/components/landing/PodcastSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { GetStartedSection } from '@/components/landing/GetStartedSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="overflow-hidden">
        <HeroSection />
        <StatsSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PodcastSection />
        <PricingSection />
        <GetStartedSection />
      </main>
    </div>
  );
}

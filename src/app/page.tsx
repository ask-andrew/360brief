import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { GetStartedSection } from '@/components/landing/GetStartedSection';
import { StatsSection } from '@/components/landing/StatsSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="overflow-hidden">
        <HeroSection />
        <StatsSection />
        <GetStartedSection />
      </main>
    </div>
  );
}

import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PodcastSection } from '@/components/landing/PodcastSection';
import { GetStartedSection } from '@/components/landing/GetStartedSection';
import { BetaWaitlist } from '@/components/marketing/BetaWaitlist';
import { ProductPreviewSection } from '@/components/landing/ProductPreviewSection';
import { BriefStyleSelectorSection } from '@/components/landing/BriefStyleSelectorSection';
import { TimeSavingsCalculatorSection } from '@/components/landing/TimeSavingsCalculatorSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="overflow-hidden">
        <HeroSection />
        {/* Waitlist Marketing Section */}
        <section className="relative isolate mx-auto my-8 max-w-6xl rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur sm:my-12 sm:p-10">
          <div className="absolute inset-x-0 -top-10 -z-10 mx-auto h-24 w-[90%] rounded-full bg-gradient-to-r from-indigo-200/40 via-purple-200/40 to-pink-200/40 blur-2xl" />
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Early Access
              </div>
              <h2 className="text-2xl font-bold leading-tight sm:text-3xl">Join the 360Brief Beta</h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Multiply your time. Get concise, executive-ready briefs from Gmail, Calendar, and more. Be the first to shape
                the roadmap and unlock priority access.
              </p>
              <ul className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" /> Priority onboarding</li>
                <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" /> Influence features</li>
                <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" /> Privacy-first design</li>
                <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" /> Web, Email, Audio</li>
                <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" /> Business + Personal profiles</li>
              </ul>
            </div>
            <div className="flex justify-center md:justify-end">
              <BetaWaitlist />
            </div>
          </div>
        </section>
        <HowItWorksSection />
        <BriefStyleSelectorSection />
        <StatsSection />
        <TimeSavingsCalculatorSection />
        <GetStartedSection />
        <ProductPreviewSection />
        <PodcastSection />
      </main>
    </div>
  );
}

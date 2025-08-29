import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { BriefStyleSelectorSection } from '@/components/landing/BriefStyleSelectorSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { GetStartedSection } from '@/components/landing/GetStartedSection';
import { ProductPreviewSection } from '@/components/landing/ProductPreviewSection';
import { PodcastSection } from '@/components/landing/PodcastSection';
import { BetaWaitlist } from '@/components/marketing/BetaWaitlist';
import { UseCaseTabs } from '@/components/landing/UseCaseTabs';
import { SignInButton } from '@/components/SignInButton';
import { AuthCodeHandler } from '@/components/AuthCodeHandler';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <AuthCodeHandler />
      <Navbar />
      <main className="overflow-hidden">
        <HeroSection />
        
        {/* Waitlist Section - Moved up */}
        <section className="py-12 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Join the Beta Waitlist</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Be among the first to experience 360Brief and transform how you manage your communications.
              </p>
              <div className="flex justify-center">
                <BetaWaitlist />
              </div>
            </div>
          </div>
        </section>
        
        {/* Use Case Tabs */}
        <UseCaseTabs />
        
        {/* How It Works */}
        <HowItWorksSection />
        
        {/* Brief Style Selector */}
        <BriefStyleSelectorSection />
        
        {/* Stats Section */}
        <StatsSection />
        
        {/* Product Preview */}
        <ProductPreviewSection />
        
        {/* Beta Waitlist Section - Moved down in the page */}
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
        
        {/* Get Started CTA */}
        <GetStartedSection />
        
        {/* Podcast Section */}
        <PodcastSection />
      </main>
    </div>
  );
}

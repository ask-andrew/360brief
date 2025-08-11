"use client";

import Image from 'next/image';
import dashboardPreview from '@/assets/images/dashboard-preview.webp';

export function ProductPreviewSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center mb-10">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 text-sm font-medium rounded-full border border-primary/20 bg-primary/10 text-primary">
            Product Preview
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Glimpse of Analytics
          </h2>
          <p className="text-lg text-muted-foreground">Visual signals that drive action: see priorities, patterns, and performance at a glance.</p>
        </div>

        <div className="relative mx-auto h-[420px] max-w-5xl overflow-hidden rounded-2xl border bg-background/50 shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
          <Image
            src={dashboardPreview}
            alt="Analytics dashboard preview"
            fill
            className="object-cover bg-white pan-vert"
            placeholder="blur"
            sizes="(max-width: 768px) 100vw, 1080px"
            priority
          />
          <style jsx>{`
            .pan-vert { 
              animation: panY 18s ease-in-out infinite;
              will-change: transform;
            }
            .pan-vert:hover { 
              animation-play-state: paused;
            }
            @keyframes panY {
              0% { transform: translateY(0%); }
              50% { transform: translateY(-20%); }
              100% { transform: translateY(0%); }
            }
            @media (prefers-reduced-motion: reduce) {
              .pan-vert { animation: none; }
            }
          `}</style>
        </div>

        {/* Analytics highlights */}
        <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white/60 p-4 text-center shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Priority Messages</div>
            <div className="text-2xl font-semibold">12</div>
          </div>
          <div className="rounded-xl border bg-white/60 p-4 text-center shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Response Latency</div>
            <div className="text-2xl font-semibold">-28%</div>
          </div>
          <div className="rounded-xl border bg-white/60 p-4 text-center shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Meeting Load (wk)</div>
            <div className="text-2xl font-semibold">14</div>
          </div>
          <div className="rounded-xl border bg-white/60 p-4 text-center shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Sentiment Trend</div>
            <div className="text-2xl font-semibold">↑ Positive</div>
          </div>
        </div>
      </div>
    </section>
  );
}

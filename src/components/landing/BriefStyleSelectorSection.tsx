"use client";

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const STYLES = [
  {
    key: 'mission_brief',
    name: 'Mission Brief',
    blurb: 'BLUF, status → action. Zero ambiguity.',
    preview:
      'BLUF: Product launch on track. Risks: vendor delay. Actions: approve budget, unblock API dependency.'
  },
  {
    key: 'management_consulting',
    name: 'Management Consulting',
    blurb: 'Executive summary + supporting analysis.',
    preview:
      'Executive Summary: CSAT rising, churn risk localized to SMB. Drivers: onboarding gaps. Recommended: playbook revamp.'
  },
  {
    key: 'startup_velocity',
    name: 'Startup Velocity',
    blurb: 'Speed, growth, action bias.',
    preview:
      'Growth: +12% WoW leads. Bottleneck: handoffs. Next: automate triage, ship weekly metrics digest.'
  },
  {
    key: 'newspaper_newsletter',
    name: 'Newspaper Newsletter',
    blurb: 'Headlines + feature story + roundup.',
    preview:
      'Headlines: Deal closed, release slipped. Feature: Q3 roadmap tradeoffs. Roundup: team wins + blockers.'
  }
] as const;

type StyleKey = typeof STYLES[number]['key'];

export function BriefStyleSelectorSection() {
  const [selected, setSelected] = useState<StyleKey>('mission_brief');

  // load persisted selection
  useEffect(() => {
    try {
      const saved = localStorage.getItem('brief_style') as StyleKey | null;
      if (saved) setSelected(saved);
    } catch {}
  }, []);

  // persist selection
  useEffect(() => {
    try {
      localStorage.setItem('brief_style', selected);
    } catch {}
  }, [selected]);

  const selectedMeta = useMemo(() => STYLES.find(s => s.key === selected), [selected]);

  return (
    <section className="py-20 bg-background" aria-labelledby="brief-style-heading">
      <div className="container">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Personalize Your Brief
          </div>
          <h2 id="brief-style-heading" className="mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Choose your communication style
          </h2>
          <p className="text-lg text-muted-foreground">Pick a tone that fits how you think. You can change this anytime.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STYLES.map((s) => (
            <button
              key={s.key}
              onClick={() => setSelected(s.key)}
              className={cn(
                'group relative flex h-full flex-col rounded-2xl border p-5 text-left transition-all',
                selected === s.key
                  ? 'border-primary/40 shadow-md ring-2 ring-primary/20'
                  : 'border-border/50 hover:border-primary/30 hover:shadow-sm'
              )}
              aria-pressed={selected === s.key}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-semibold">{s.name}</div>
                {selected === s.key && (
                  <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
                )}
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{s.blurb}</p>
              <div className="rounded-lg bg-muted/40 p-3 text-sm text-foreground/90">
                “{s.preview}”
              </div>
            </button>
          ))}
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/signup?style=${selected}`}
            className={cn(
              'inline-flex items-center justify-center rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground',
              'transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            Use this style
          </Link>
          <a
            href="#style-comparison"
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-6 py-4 text-base font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Compare styles
          </a>
        </div>
      </div>
    </section>
  );
}

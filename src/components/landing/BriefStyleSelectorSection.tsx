"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import * as Dialog from '@radix-ui/react-dialog';

const STYLES = [
  {
    key: 'mission_brief',
    name: 'Mission Brief',
    blurb: 'BLUF, status → action. Zero ambiguity.',
    philosophy: 'Maximum efficiency, zero ambiguity',
    tone: 'Direct, authoritative, urgent',
    structure: 'BLUF (Bottom Line Up Front), status → action format',
    bestFor: 'Crisis management, operations-focused executives',
    preview:
      'BLUF: Product launch on track. Risks: vendor delay. Actions: approve budget, unblock API dependency.',
    examples: [
      'BLUF: Q2 targets at risk. Actions: Reallocate 2 engineers to fix checkout flow by EOD.',
      'Status: 3 blockers identified. Next: Escalate to VP Eng. ETA: 24h.',
      'Action required: Sign off on budget by 5PM for vendor payment.'
    ]
  },
  {
    key: 'management_consulting',
    name: 'Management Consulting',
    blurb: 'Executive summary + supporting analysis.',
    philosophy: 'Strategic frameworks, data-driven insights',
    tone: 'Professional, analytical, confident',
    structure: 'Executive summary + supporting analysis',
    bestFor: 'Strategy-focused leaders, board preparation',
    preview:
      'Executive Summary: CSAT rising, churn risk localized to SMB. Drivers: onboarding gaps. Recommended: playbook revamp.',
    examples: [
      'Strategic Insight: Customer segmentation reveals 80% of revenue from 20% of clients. Recommendation: Implement tiered service model.',
      'Analysis: Support ticket resolution time increased by 35% QoQ. Root cause: New product complexity. Solution: Targeted training program.',
      'Recommendation: Expand to mid-market segment. Rationale: 3.2x higher LTV than SMB with only 1.5x support cost.'
    ]
  },
  {
    key: 'startup_velocity',
    name: 'Startup Velocity',
    blurb: 'Speed, growth, action bias.',
    philosophy: 'Speed and agility focus',
    tone: 'Casual, energetic, growth-minded',
    structure: 'Metrics-driven with action bias',
    bestFor: 'Fast-moving founders, product leaders',
    preview:
      'Growth: +12% WoW leads. Bottleneck: handoffs. Next: automate triage, ship weekly metrics digest.',
    examples: [
      '🚀 15% more signups from new landing page! Next: A/B test CTA colors.',
      '🔥 Hot lead from YC demo day! Following up tomorrow. Need pricing deck.',
      '🔄 Shipped v1 of dashboard. Bugs: 3 minor. Next: User testing on Friday.'
    ]
  },
  {
    key: 'newspaper_newsletter',
    name: 'Newspaper Newsletter',
    blurb: 'Headlines + feature story + roundup.',
    philosophy: 'Editorial depth with narrative storytelling',
    tone: 'Journalistic, informative, engaging',
    structure: 'Headlines + feature story + news roundup',
    bestFor: 'Content-savvy executives, comprehensive coverage',
    preview:
      'Headlines: Deal closed, release slipped. Feature: Q3 roadmap tradeoffs. Roundup: team wins + blockers.',
    examples: [
      '📰 THE MORNING BRIEF: Enterprise deal closes at 2.1x ACV. Engineering delays push beta to Q3. Team Spotlight: Sales hits 142% of quota.',
      'FEATURE: Behind the Pivot - How customer feedback reshaped our product roadmap. Key insights from 200+ user interviews.',
      'IN DEPTH: Analyzing the 37% support ticket reduction. How automation and better docs moved the needle.'
    ]
  }
] as const;

type StyleKey = typeof STYLES[number]['key'];

type StyleExampleProps = {
  content: string;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

const StyleExample = ({ content, index, total, onPrev, onNext }: StyleExampleProps) => (
  <div className="relative flex h-full flex-col">
    <div className="mb-4 flex-1 overflow-auto rounded-lg border p-4 text-sm">
      <div className="whitespace-pre-line">{content}</div>
    </div>
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <button 
        onClick={onPrev}
        className="flex items-center gap-1 rounded p-1 hover:bg-muted"
        aria-label="Previous example"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
      </button>
      <span className="text-xs">Example {index + 1} of {total}</span>
      <button 
        onClick={onNext}
        className="flex items-center gap-1 rounded p-1 hover:bg-muted"
        aria-label="Next example"
      >
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const StyleCard = ({ style, isSelected, onSelect }: { 
  style: typeof STYLES[number]; 
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <div 
    className={cn(
      'flex h-full flex-col rounded-lg border p-4 transition-colors',
      isSelected ? 'border-primary/40 bg-primary/5' : 'border-border/50 hover:bg-muted/30'
    )}
  >
    <h4 className="mb-2 text-lg font-semibold">{style.name}</h4>
    <p className="mb-3 text-sm text-muted-foreground">{style.blurb}</p>
    <div className="mt-auto">
      <button
        onClick={onSelect}
        className={cn(
          'w-full rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isSelected 
            ? 'bg-primary text-primary-foreground' 
            : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
        )}
      >
        {isSelected ? 'Selected' : 'Select'}
      </button>
    </div>
  </div>
);

export function BriefStyleSelectorSection() {
  const [selected, setSelected] = useState<StyleKey>('mission_brief');
  const [showCompare, setShowCompare] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>('mission_brief');
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  // load persisted selection
  useEffect(() => {
    try {
      const saved = localStorage.getItem('brief_style') as StyleKey | null;
      if (saved) {
        setSelected(saved);
        setSelectedStyle(saved);
      }
    } catch {}
  }, []);

  // persist selection
  useEffect(() => {
    try {
      localStorage.setItem('brief_style', selected);
    } catch {}
  }, [selected]);

  const selectedMeta = useMemo(() => STYLES.find(s => s.key === selected), [selected]);
  const currentStyle = useMemo(() => 
    STYLES.find(s => s.key === selectedStyle) || STYLES[0], 
    [selectedStyle]
  );

  const navigateExample = useCallback((direction: 'prev' | 'next') => {
    if (!currentStyle.examples) return;
    
    setSelectedExampleIndex(prev => {
      if (direction === 'prev') {
        return prev === 0 ? currentStyle.examples.length - 1 : prev - 1;
      } else {
        return prev === currentStyle.examples.length - 1 ? 0 : prev + 1;
      }
    });
  }, [currentStyle.examples]);

  const handleStyleSelect = (styleKey: StyleKey) => {
    setSelectedStyle(styleKey);
    setSelectedExampleIndex(0);
  };

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
          <button
            onClick={() => setShowCompare(true)}
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-6 py-4 text-base font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Compare styles
          </button>
        </div>

        <Dialog.Root open={showCompare} onOpenChange={setShowCompare}>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <Dialog.Title className="text-2xl font-bold">Compare Communication Styles</Dialog.Title>
        <Dialog.Close asChild>
          <button className="rounded-full p-2 hover:bg-muted" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </Dialog.Close>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Style Selector */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">Select a Style</h3>
          <div className="space-y-3">
            {STYLES.map((style) => (
              <StyleCard 
                key={style.key}
                style={style}
                isSelected={selectedStyle === style.key}
                onSelect={() => handleStyleSelect(style.key)}
              />
            ))}
          </div>
        </div>
        
        {/* Style Details */}
        <div className="md:col-span-2">
          <div className="mb-6 rounded-lg border p-6">
            <h3 className="mb-4 text-xl font-bold">{currentStyle.name}</h3>
            <p className="mb-4 text-muted-foreground">{currentStyle.philosophy}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Tone</h4>
                <p>{currentStyle.tone}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Best For</h4>
                <p>{currentStyle.bestFor}</p>
              </div>
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground">Structure</h4>
                <p>{currentStyle.structure}</p>
              </div>
            </div>
            
            {/* Example Carousel */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">Example</h4>
              <div className="rounded-lg border p-4">
                <StyleExample 
                  content={currentStyle.examples[selectedExampleIndex]}
                  index={selectedExampleIndex}
                  total={currentStyle.examples.length}
                  onPrev={() => navigateExample('prev')}
                  onNext={() => navigateExample('next')}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={() => {
                setSelected(selectedStyle);
                setShowCompare(false);
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Use {currentStyle.name} Style
            </button>
          </div>
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
      </div>
    </section>
  );
}


import React from 'react';
import { ShieldAlertIcon, BriefcaseIcon, RocketIcon, NewspaperIcon } from './Icons';

interface Style {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  bestFor: string;
}

const stylesData: Style[] = [
  {
    id: 'command',
    title: 'Command Brief',
    icon: <ShieldAlertIcon className="w-10 h-10" />,
    description: 'Maximum efficiency, zero ambiguity. BLUF format for urgent, operations-focused decisions.',
    bestFor: 'Crisis management, ops executives'
  },
  {
    id: 'consulting',
    title: 'Management Consulting',
    icon: <BriefcaseIcon className="w-10 h-10" />,
    description: 'Strategic frameworks and data-driven insights. Executive summaries for board-level strategy.',
    bestFor: 'Strategy leaders, board preparation'
  },
  {
    id: 'startup',
    title: 'Startup Velocity',
    icon: <RocketIcon className="w-10 h-10" />,
    description: 'Metrics-driven with an action bias. Focus on momentum, blockers, and wins.',
    bestFor: 'Fast-moving founders, product leaders'
  },
  {
    id: 'newspaper',
    title: 'Newspaper Newsletter',
    icon: <NewspaperIcon className="w-10 h-10" />,
    description: 'Editorial depth with narrative storytelling. Headlines and feature stories for context-rich updates.',
    bestFor: 'Content-savvy execs, comprehensive coverage'
  },
];

const StyleCard: React.FC<{ style: Style }> = ({ style }) => (
  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-full flex flex-col transition-all duration-300 hover:border-brand-blue hover:-translate-y-1">
    <div className="text-brand-blue mb-4">{style.icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{style.title}</h3>
    <p className="text-slate-400 text-sm flex-grow">{style.description}</p>
    <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">BEST FOR</p>
        <p className="text-sm text-slate-300 mt-1">{style.bestFor}</p>
    </div>
  </div>
);

const BriefingStyles: React.FC = () => {
  return (
    <section id="briefing-styles" className="py-20">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">A Brief for Every Leadership Style</h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-16">
          Your daily summary isn't one-size-fits-all. Choose the tone, structure, and depth that matches how you think and work.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stylesData.map((style) => (
          <StyleCard key={style.id} style={style} />
        ))}
      </div>
    </section>
  );
};

export default BriefingStyles;

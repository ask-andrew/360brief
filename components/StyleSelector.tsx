
import React, { useState } from 'react';
import { ShieldAlertIcon, BriefcaseIcon, RocketIcon, NewspaperIcon } from './Icons';

interface Style {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  example: { title: string; text: string; };
}

const styleData: Style[] = [
  {
    id: 'command',
    title: 'Command Brief',
    icon: <ShieldAlertIcon className="w-8 h-8" />,
    description: 'Maximum efficiency, zero ambiguity. Direct, authoritative, and urgent for crisis management and operations-focused executives.',
    example: {
        title: 'BLUF Example',
        text: `SITUATION: Project Orion 7 days behind. Critical API dependency failed. Board demo at risk.\nACTION REQUIRED: Resource reallocation decision needed by 1400 hours today.`
    }
  },
  {
    id: 'consulting',
    title: 'Management Consulting',
    icon: <BriefcaseIcon className="w-8 h-8" />,
    description: 'Strategic frameworks and data-driven insights. Professional, analytical, and confident for strategy-focused leaders.',
    example: {
        title: 'Executive Summary Example',
        text: `Strategic Context: Project Orion represents 35% of our Q3 product roadmap value...\nCritical Insight: Resource constraints have created a bottleneck...`
    }
  },
  {
    id: 'startup',
    title: 'Startup Velocity',
    icon: <RocketIcon className="w-8 h-8" />,
    description: 'Speed and agility focus. Casual, energetic, and growth-minded for fast-moving founders and product leaders.',
    example: {
        title: 'Velocity Check Example',
        text: `🚀 We're shipping 23% faster, but Orion hit a gnarly API blocker...\n🚧 What's Stuck: CloudSync dependency + backend team at capacity...`
    }
  },
  {
    id: 'newspaper',
    title: 'Newspaper Newsletter',
    icon: <NewspaperIcon className="w-8 h-8" />,
    description: 'Editorial depth with narrative storytelling. Journalistic, informative, and engaging for comprehensive coverage preference.',
    example: {
        title: 'Headlines Example',
        text: `• Project Orion: Critical API dependency creates 7-day delay...\n• Resource Crunch: Backend team operating at 110% capacity...`
    }
  },
];

const StyleCard: React.FC<{style: Style; isSelected: boolean; onSelect: () => void;}> = ({ style, isSelected, onSelect }) => {
  return (
    <div 
      onClick={onSelect}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? onSelect() : null}
      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col ${
        isSelected 
        ? 'border-brand-blue bg-slate-800 scale-105 shadow-2xl shadow-sky-900/50' 
        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="text-brand-blue flex-shrink-0">{style.icon}</div>
        <h3 className="text-xl font-bold text-white">{style.title}</h3>
      </div>
      <p className="text-slate-400 text-sm mb-5 flex-grow">{style.description}</p>
      
      <div className="bg-brand-dark/50 p-4 rounded-lg border border-slate-700/50 mt-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{style.example.title}</p>
        <p className="text-sm text-slate-300 font-mono whitespace-pre-line">{style.example.text}</p>
      </div>
    </div>
  );
};

const StyleSelector: React.FC<{onSave: () => void}> = ({ onSave }) => {
  const [selectedStyle, setSelectedStyle] = useState<string | null>('startup');

  const handleSave = () => {
    // Here you would normally save the preference to the backend.
    // For this mock, we just call the callback to move to the next step in the UI.
    onSave();
  };

  return (
    <div className="animate-fade-in-up mt-12" style={{ animationDelay: '200ms' }}>
      <h2 className="text-2xl font-bold text-white text-center mb-4">Choose Your Briefing Style</h2>
      <p className="text-slate-400 text-center max-w-2xl mx-auto mb-10">
        Your brief's tone and structure can be tailored to your preference. Select the style that best fits how you work.
      </p>
      
      <div className="grid md:grid-cols-2 gap-6" role="radiogroup" aria-label="Briefing style options">
        {styleData.map(style => (
          <StyleCard 
            key={style.id}
            style={style}
            isSelected={selectedStyle === style.id}
            onSelect={() => setSelectedStyle(style.id)}
          />
        ))}
      </div>

      <div className="text-center mt-10">
        <button 
          onClick={handleSave}
          className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-sky-400 transition-all duration-300 shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 transform hover:-translate-y-1 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
          disabled={!selectedStyle}
        >
          Save and Complete Setup
        </button>
      </div>
    </div>
  );
};

export default StyleSelector;

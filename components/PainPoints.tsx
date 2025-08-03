import React from 'react';
import { ClockIcon, EyeIcon, LayersIcon, BarChart2Icon } from './Icons';

const PainPoints: React.FC = () => {
  const painPoints = [
    {
      icon: <ClockIcon className="w-8 h-8 text-brand-blue" />,
      title: "Time Drain",
      description: "Executives spend 20+ hours weekly just processing information",
      stat: "20+ hrs/week",
      statDescription: "wasted on information processing"
    },
    {
      icon: <EyeIcon className="w-8 h-8 text-brand-blue" />,
      title: "Information Overload",
      description: "Critical insights get lost in the noise of daily communications",
      stat: "67%",
      statDescription: "of executives miss key information in their daily workflow"
    },
    {
      icon: <LayersIcon className="w-8 h-8 text-brand-blue" />,
      title: "Tool Fatigue",
      description: "Constantly switching between multiple platforms kills productivity",
      stat: "9+",
      statDescription: "different tools used daily by the average executive"
    },
    {
      icon: <BarChart2Icon className="w-8 h-8 text-brand-blue" />,
      title: "Decision Lag",
      description: "Delayed insights lead to slower, less effective decision-making",
      stat: "3.5x",
      statDescription: "faster decision-making with consolidated insights"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-blue/50 to-transparent"></div>
      
      <div className="container mx-auto px-6 md:px-12 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            The Executive's Dilemma
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Modern leadership requires processing more information than ever before. Here's what we're up against:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {painPoints.map((point, index) => (
            <div 
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-brand-blue/30 transition-all duration-300 transform hover:-translate-y-1"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-slate-800 p-2 rounded-lg">
                  {point.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{point.title}</h3>
                  <p className="text-slate-400 text-sm mb-3">{point.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-brand-blue">{point.stat}</span>
                    <span className="ml-2 text-sm text-slate-500">{point.statDescription}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Before/After Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-red-500/20">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <h3 className="text-xl font-bold text-red-400">Before 360Brief</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-slate-300">Drowning in endless email threads and messages</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-slate-300">Missed opportunities due to information overload</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-slate-300">Reactive instead of strategic decision-making</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-slate-300">Constant context switching between tools</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-brand-blue/30">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 rounded-full bg-brand-blue mr-2"></div>
              <h3 className="text-xl font-bold text-brand-blue">With 360Brief</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-brand-blue mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-300">Concise, actionable briefs in minutes, not hours</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-brand-blue mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-300">AI-powered insights surface what matters most</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-brand-blue mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-300">Proactive, data-driven decision making</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-brand-blue mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-300">Unified view across all your communication channels</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainPoints;

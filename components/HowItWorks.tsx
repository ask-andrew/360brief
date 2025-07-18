
import React, { useState } from 'react';
import { LinkIcon, CpuIcon, RadioIcon, ShieldCheckIcon, GmailIcon, SlackIcon, GoogleCalendarIcon } from './Icons';
import { Step1Visual, Step2Visual, Step3Visual } from './StepVisuals';

const HowItWorks: React.FC = () => {
  const [frequency, setFrequency] = useState<'Daily' | 'Every 2-3 Days' | 'Weekly'>('Daily');

  const steps = [
    {
      icon: <LinkIcon className="h-10 w-10 text-brand-blue" />,
      title: '1. Connect Your Tools',
      description: 'Securely link your Gmail, Google Calendar, and Slack accounts in seconds. Your credentials are never stored, and access is managed via secure OAuth tokens.',
      sources: [
        { name: 'Gmail', icon: <GmailIcon className="h-5 w-5" /> },
        { name: 'Google Calendar', icon: <GoogleCalendarIcon className="h-5 w-5" /> },
        { name: 'Slack', icon: <SlackIcon className="h-5 w-5" /> },
      ]
    },
    {
      icon: <CpuIcon className="h-10 w-10 text-brand-blue" />,
      title: '2. AI-Powered Processing',
      description: 'Our LLM analyzes recent messages and events to identify key themes, progress updates, potential blockers, and noteworthy contributions from your team.',
    },
    {
      icon: <RadioIcon className="h-10 w-10 text-brand-blue" />,
      title: '3. Receive Your Briefing',
      description: 'Get your personalized summary delivered as a clean web digest, an email, or a podcast-style audio brief to listen to on your commute.',
    },
  ];

  const frequencyOptions: Array<'Daily' | 'Every 2-3 Days' | 'Weekly'> = ['Daily', 'Every 2-3 Days', 'Weekly'];

  const visuals = [
    <Step1Visual key="vis1" />,
    <Step2Visual key="vis2" />,
    <Step3Visual key="vis3" />,
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">From Noise to Signal in 3 Steps</h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-16">
          A simple, privacy-first process to reclaim your focus.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-1/2 top-10 bottom-10 w-0.5 bg-slate-700 hidden md:block" aria-hidden="true"></div>
        <div className="grid md:grid-cols-1 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col md:flex-row items-center gap-8 opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 200}ms`}}>
              <div className={`md:w-5/12 ${index % 2 === 0 ? 'md:order-1' : 'md:order-3'}`}>
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-3">
                    {step.icon}
                    <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="text-slate-400 flex-grow">{step.description}</p>
                   {step.sources && (
                     <div className="mt-4 flex items-center gap-4 flex-wrap">
                        {step.sources.map(source => (
                            <div key={source.name} className="flex items-center gap-2 text-slate-300 bg-slate-700/50 px-3 py-1 rounded-full text-sm">
                                {source.icon}
                                {source.name}
                            </div>
                        ))}
                     </div>
                   )}
                   {index === 2 && (
                     <div className="mt-6">
                       <p className="text-sm font-semibold text-slate-300 mb-3">How often?</p>
                       <div className="flex items-center gap-2 flex-wrap">
                        {frequencyOptions.map(option => (
                          <button
                            key={option}
                            onClick={() => setFrequency(option)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                              frequency === option
                                ? 'bg-brand-blue text-white shadow-md shadow-sky-500/20'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                       </div>
                     </div>
                   )}
                </div>
              </div>
              <div className="w-12 h-12 bg-brand-dark border-2 border-brand-blue rounded-full flex items-center justify-center text-white font-bold text-xl md:order-2 flex-shrink-0 z-10">{index + 1}</div>
              <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:order-3' : 'md:order-1'}`}>
                {visuals[index]}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-20 bg-slate-800/50 p-8 rounded-2xl border border-green-500/30 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <ShieldCheckIcon className="h-16 w-16 text-green-400 flex-shrink-0"/>
          <div>
            <h3 className="text-2xl font-bold text-white">Secure By Design</h3>
            <p className="text-slate-400 mt-2 max-w-3xl">Your privacy is paramount. All processing runs locally in a secure sandbox. We only request read-access, and your messages are never stored, shared, or used for training.</p>
          </div>
      </div>
    </section>
  );
};

export default HowItWorks;
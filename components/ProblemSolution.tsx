
import React from 'react';
import { FragmentIcon, MailIcon, MessageSquareIcon, AlertTriangleIcon, CheckCircleIcon, ZapIcon, TargetIcon, GiftIcon } from './Icons';

const ProblemSolution: React.FC = () => {
  return (
    <section id="problem-solution" className="py-20">
      <div className="grid md:grid-cols-2 gap-10 items-stretch">
        {/* Problem */}
        <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <AlertTriangleIcon className="h-8 w-8 text-amber-400" />
                <h2 className="text-3xl font-bold text-white">The Problem</h2>
            </div>
            <p className="text-slate-400 mb-6 flex-grow">Fragmented information across dozens of tools means managers miss critical signals, lose context, and waste hours just catching up.</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3"><FragmentIcon className="h-6 w-6 text-slate-500 mt-1 flex-shrink-0" /><span className="text-slate-300">Key signals lost in the noise of email and Slack.</span></li>
              <li className="flex items-start gap-3"><MailIcon className="h-6 w-6 text-slate-500 mt-1 flex-shrink-0" /><span className="text-slate-300">Endless context-switching between platforms.</span></li>
              <li className="flex items-start gap-3"><MessageSquareIcon className="h-6 w-6 text-slate-500 mt-1 flex-shrink-0" /><span className="text-slate-300">Progress, blockers, and wins are hard to track.</span></li>
            </ul>
        </div>
        {/* Solution */}
        <div className="bg-gradient-to-br from-sky-900/50 to-slate-800/50 p-8 rounded-2xl border border-brand-blue/50 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-400" />
                <h2 className="text-3xl font-bold text-white">The Solution</h2>
            </div>
            <p className="text-slate-300 mb-6 flex-grow">360Brief delivers a concise, daily AI-powered brief. It’s your personal chief of staff, briefing you on what truly matters.</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3"><TargetIcon className="h-6 w-6 text-brand-blue mt-1 flex-shrink-0" /><span className="text-slate-200">Identify key themes across all channels.</span></li>
              <li className="flex items-start gap-3"><ZapIcon className="h-6 w-6 text-brand-blue mt-1 flex-shrink-0" /><span className="text-slate-200">Highlight progress, blockers, and decisions automatically.</span></li>
              <li className="flex items-start gap-3"><GiftIcon className="h-6 w-6 text-brand-blue mt-1 flex-shrink-0" /><span className="text-slate-200">Surface opportunities for kudos and recognition.</span></li>
            </ul>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
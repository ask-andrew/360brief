'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Calendar, Zap } from 'lucide-react';

const useCases = [
  {
    id: 'overloaded',
    title: 'The Overloaded Executive',
    description: 'In back-to-back meetings all day? Get your critical updates in minutes, not hours.',
    problem: 'Drowning in emails and messages between meetings',
    solution: 'Get a concise morning briefing that surfaces only what matters',
    benefit: 'Start each day focused and prepared, not playing catch-up',
    icon: <Briefcase className="h-6 w-6" />,
    image: {
      src: '/images/use-cases/overloaded-executive.jpg',
      alt: 'Executive in a meeting room looking at a laptop'
    }
  },
  {
    id: 'returning',
    title: 'Back from Vacation',
    description: 'Dread the post-vacation email pileup? We\'ve got you covered.',
    problem: 'Hundreds of unread messages after time off',
    solution: 'Smart summary of what happened while you were away',
    benefit: 'Catch up in minutes, not hours',
    icon: <Calendar className="h-6 w-6" />,
    image: {
      src: '/images/use-cases/back-from-vacation.jpg',
      alt: 'Person working on a laptop at a beach'
    }
  },
  {
    id: 'multitasker',
    title: 'The Multi-Hatted Professional',
    description: 'Juggling work and personal commitments? Keep everything in sync.',
    problem: 'Constantly switching contexts and missing important details',
    solution: 'Unified briefs that combine all your priorities',
    benefit: 'Better work-life integration without the stress',
    icon: <Zap className="h-6 w-6" />,
    image: {
      src: '/images/use-cases/multi-hatted-professional.jpg',
      alt: 'Person managing multiple tasks'
    }
  }
];

export function UseCaseTabs() {
  const [activeTab, setActiveTab] = useState(useCases[0].id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Designed for how you work
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          See how 360Brief adapts to your unique workflow
        </p>
      </div>

      <div className="mt-12">
        {/* Tab List */}
        <div className="flex flex-wrap justify-center gap-4">
          {useCases.map((useCase) => (
            <button
              key={useCase.id}
              onClick={() => setActiveTab(useCase.id)}
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === useCase.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {useCase.icon}
              {useCase.title}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-xl">
          <AnimatePresence mode="wait">
            {useCases.map(
              (useCase) =>
                activeTab === useCase.id && (
                  <motion.div
                    key={useCase.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2"
                  >
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {useCase.title}
                      </h3>
                      <p className="text-lg text-gray-600">
                        {useCase.description}
                      </p>
                      <div className="space-y-4">
                        <div className="rounded-lg bg-gray-50 p-4">
                          <h4 className="text-sm font-medium text-gray-900">
                            The Problem
                          </h4>
                          <p className="mt-1 text-gray-600">
                            {useCase.problem}
                          </p>
                        </div>
                        <div className="rounded-lg bg-indigo-50 p-4">
                          <h4 className="text-sm font-medium text-indigo-900">
                            How 360Brief Helps
                          </h4>
                          <p className="mt-1 text-indigo-800">
                            {useCase.solution}
                          </p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-4">
                          <h4 className="text-sm font-medium text-emerald-900">
                            The Benefit
                          </h4>
                          <p className="mt-1 text-emerald-800">
                            {useCase.benefit}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 overflow-hidden">
                      <div className="relative w-full h-64 md:h-full">
                        <img
                          src={useCase.image.src}
                          alt={useCase.image.alt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

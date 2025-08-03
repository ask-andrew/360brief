import React, { useState, useEffect } from 'react';
import { BrainCircuitIcon, LayersIcon, ZapIcon, ClockIcon } from './Icons';

type DemoStep = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  isActive: boolean;
};

const ProductDemo: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const demoSteps: DemoStep[] = [
    {
      id: 1,
      title: 'Connect Your Tools',
      description: 'Link your email, calendar, and communication channels in seconds',
      icon: <LayersIcon className="w-6 h-6 text-brand-blue" />,
      image: '/images/demo-connect.svg',
      isActive: activeStep === 0
    },
    {
      id: 2,
      title: 'AI Processes Your Data',
      description: 'Our AI analyzes your communications to identify key insights and priorities',
      icon: <BrainCircuitIcon className="w-6 h-6 text-brand-blue" />,
      image: '/images/demo-ai.svg',
      isActive: activeStep === 1
    },
    {
      id: 3,
      title: 'Get Your Daily Brief',
      description: 'Receive a concise, actionable summary of what matters most',
      icon: <ZapIcon className="w-6 h-6 text-brand-blue" />,
      image: '/images/demo-brief.svg',
      isActive: activeStep === 2
    },
    {
      id: 4,
      title: 'Save Hours Every Week',
      description: 'Reduce time spent processing information by up to 80%',
      icon: <ClockIcon className="w-6 h-6 text-brand-blue" />,
      image: '/images/demo-save-time.svg',
      isActive: activeStep === 3
    }
  ];

  // Auto-advance the demo steps
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setTimeout(() => {
      setActiveStep((prev) => (prev === demoSteps.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => clearTimeout(timer);
  }, [activeStep, isAutoPlaying, demoSteps.length]);

  // Placeholder for demo video modal
  const [showVideo, setShowVideo] = useState(false);

  return (
    <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How 360Brief Works
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Transform hours of meetings and emails into a 5-minute executive brief
          </p>
        </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50">
            <div className="p-1">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Demo Content */}
                  <div className="space-y-8">
                    <div className="space-y-6">
                      {demoSteps.map((step) => (
                        <div 
                          key={step.id}
                          className={`p-6 rounded-xl transition-all duration-300 cursor-pointer ${
                            step.isActive 
                              ? 'bg-slate-700/50 border-l-4 border-brand-blue' 
                              : 'bg-slate-800/30 hover:bg-slate-700/30'
                          }`}
                          onClick={() => {
                            setActiveStep(step.id - 1);
                            setIsAutoPlaying(false);
                          }}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`p-2 rounded-lg ${
                              step.isActive ? 'bg-brand-blue/10' : 'bg-slate-700/50'
                            }`}>
                              {step.icon}
                            </div>
                            <div>
                              <h3 className={`text-lg font-semibold ${
                                step.isActive ? 'text-white' : 'text-slate-300'
                              }`}>
                                {step.title}
                              </h3>
                              <p className="text-slate-400 text-sm mt-1">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => setShowVideo(true)}
                        className="inline-flex items-center text-brand-blue hover:text-sky-400 transition-colors group"
                      >
                        <svg 
                          className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M10 16.5l6-4.5-6-4.5v9z" />
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                        </svg>
                        Watch 2-minute demo video
                      </button>
                    </div>
                  </div>

                  {/* Demo Visual */}
                  <div className="hidden lg:block relative">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue/10 to-sky-400/10 rounded-2xl blur-2xl -z-10"></div>
                      <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden h-96 flex items-center justify-center">
                        <div className="text-center p-8">
                          <div className="text-5xl mb-4">
                            {demoSteps[activeStep].icon}
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {demoSteps[activeStep].title}
                          </h3>
                          <p className="text-slate-400">
                            {demoSteps[activeStep].description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowVideo(false)}>
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 text-white hover:text-slate-300 z-10"
              onClick={() => setShowVideo(false)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-w-16 aspect-h-9 w-full">
              <div className="flex items-center justify-center h-full bg-slate-800">
                <div className="text-center p-8">
                  <div className="text-5xl mb-4">▶️</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Product Demo</h3>
                  <p className="text-slate-400">Coming soon: Watch how 360Brief transforms your workflow</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductDemo;

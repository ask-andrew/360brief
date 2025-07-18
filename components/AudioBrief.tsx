import React, { useState } from 'react';
import { LogoIcon, PlayIcon, PauseIcon, RewindIcon, FastForwardIcon } from './Icons';

const AudioBrief: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(true);

    return (
        <section id="audio-brief" className="py-20">
            <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Your Daily Briefing, On Demand</h2>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-16">
                    Listen to your personalized summary on your commute, at the gym, or on the go.
                </p>
            </div>

            <div className="relative mx-auto border-slate-800 bg-slate-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                <div className="w-[148px] h-[18px] bg-slate-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                <div className="h-[46px] w-[3px] bg-slate-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                <div className="h-[46px] w-[3px] bg-slate-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
                <div className="h-[64px] w-[3px] bg-slate-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
                <div className="rounded-[2rem] overflow-hidden w-full h-full bg-brand-dark">
                    <div className="px-6 py-10 text-white flex flex-col h-full">
                        <div className="text-center mb-8">
                            <p className="text-sm text-brand-blue font-semibold tracking-wider">NOW PLAYING</p>
                            <h3 className="text-xl font-bold mt-1">360Brief Daily</h3>
                        </div>

                        <div className="flex-grow flex items-center justify-center">
                            <div className="w-48 h-48 bg-gradient-to-br from-brand-blue to-sky-700 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                                <LogoIcon className="w-24 h-24 text-white opacity-90" />
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            <div className="mb-4">
                                <h4 className="font-bold text-lg">Your Daily Ops Briefing</h4>
                                <p className="text-sm text-slate-400">Today's key updates</p>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="bg-slate-700 rounded-full h-1.5 w-full">
                                    <div className="bg-brand-blue h-1.5 rounded-full" style={{ width: '45%' }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>1:35</span>
                                    <span>3:55</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-6">
                                <button className="text-slate-400 hover:text-white transition-colors" aria-label="Rewind 10 seconds">
                                    <RewindIcon className="w-8 h-8" />
                                </button>
                                <button 
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-16 h-16 bg-white text-brand-dark rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform"
                                    aria-label={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
                                </button>
                                <button className="text-slate-400 hover:text-white transition-colors" aria-label="Fast-forward 10 seconds">
                                    <FastForwardIcon className="w-8 h-8" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AudioBrief;
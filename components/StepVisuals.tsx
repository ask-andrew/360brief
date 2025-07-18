
import React from 'react';
import { MailIcon, MessageSquareIcon, CpuIcon, RadioIcon, FileTextIcon, GmailIcon, GoogleCalendarIcon, SlackIcon } from './Icons';
import Logo from './Logo';

const VisualContainer: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`relative w-full min-h-[12rem] md:h-48 flex items-center justify-center p-8 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden ${className}`}>
        {children}
    </div>
);

export const Step1Visual: React.FC = () => (
    <VisualContainer>
        {/* Central Logo */}
        <div className="relative z-10 flex items-center justify-center w-20 h-20 bg-brand-blue rounded-full shadow-lg shadow-sky-500/30 animate-fade-in-up">
            <Logo className="w-12 h-12 rounded-md" />
        </div>

        {/* Floating source icons */}
        <div className="absolute top-1/2 left-4 transform -translate-y-1/2 -rotate-12 flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full animate-fade-in-up" style={{animationDelay: '200ms'}}>
            <GmailIcon className="w-8 h-8 text-slate-300" />
        </div>
        <div className="absolute top-8 right-4 transform rotate-12 flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full animate-fade-in-up" style={{animationDelay: '400ms'}}>
            <SlackIcon className="w-8 h-8 text-slate-300" />
        </div>
        <div className="absolute bottom-8 right-1/2 transform translate-x-1/2 rotate-6 flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full animate-fade-in-up" style={{animationDelay: '600ms'}}>
            <GoogleCalendarIcon className="w-8 h-8 text-slate-300" />
        </div>
    </VisualContainer>
);


export const Step2Visual: React.FC = () => (
    <VisualContainer className="flex items-center justify-between gap-4 md:gap-8">
        {/* Input Streams (Noise) */}
        <div className="w-2/5 space-y-4 animate-fade-in-up">
            <div className="w-full h-1.5 bg-slate-700 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-4/5 h-1.5 bg-slate-700 rounded-full opacity-60 animate-pulse ml-auto" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full opacity-90 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* Processor */}
        <div className="relative flex items-center justify-center flex-shrink-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
             <div className="absolute w-16 h-16 bg-brand-blue/20 rounded-full animate-ping"></div>
             <CpuIcon className="w-16 h-16 text-brand-blue z-10" />
        </div>

        {/* Output Stream (Signal) */}
        <div className="w-2/5 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
             <div className="w-full h-2 bg-gradient-to-r from-brand-blue to-sky-400 rounded-full shadow-lg shadow-sky-500/20"></div>
        </div>
    </VisualContainer>
);


export const Step3Visual: React.FC = () => (
    <VisualContainer>
       {/* Central Brief card */}
       <div className="w-40 h-24 bg-slate-700 rounded-lg p-3 flex flex-col gap-2.5 animate-fade-in-up">
            <div className="w-3/4 h-2 bg-slate-500 rounded-full"></div>
            <div className="w-full h-2 bg-slate-500 rounded-full"></div>
            <div className="w-1/2 h-2 bg-slate-500 rounded-full"></div>
            <div className="w-3/4 h-2 bg-slate-500 rounded-full"></div>
       </div>

       {/* Floating Output Icons */}
       <div className="absolute top-2 left-4 flex items-center justify-center w-14 h-14 bg-slate-800 border-2 border-slate-600 rounded-full transform -rotate-12 animate-fade-in-up" style={{animationDelay: '200ms'}}>
            <MailIcon className="w-7 h-7 text-sky-400" />
       </div>
       <div className="absolute bottom-2 right-4 flex items-center justify-center w-14 h-14 bg-slate-800 border-2 border-slate-600 rounded-full transform rotate-6 animate-fade-in-up" style={{animationDelay: '400ms'}}>
            <RadioIcon className="w-7 h-7 text-sky-400" />
       </div>
        <div className="absolute top-8 right-0 flex items-center justify-center w-14 h-14 bg-slate-800 border-2 border-slate-600 rounded-full transform rotate-12 animate-fade-in-up" style={{animationDelay: '600ms'}}>
            <FileTextIcon className="w-7 h-7 text-sky-400" />
       </div>
    </VisualContainer>
);

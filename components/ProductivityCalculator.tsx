
import React, { useState, useMemo } from 'react';
import { CalculatorIcon, QuoteIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit: string;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, onChange, unit }) => (
  <div className="w-full">
    <label className="flex justify-between items-center text-slate-300 mb-2">
      <span>{label}</span>
      <span className="font-bold text-lg text-white bg-slate-700/50 px-3 py-1 rounded-md min-w-[90px] text-center">{value} {unit}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className="w-full"
      aria-label={label}
    />
  </div>
);

const quotes = [
  {
    text: "Executives spend an average of 23 hours per week in meetings, of which nearly 50% is considered unproductive time.",
    source: "Harvard Business Review"
  },
  {
    text: "Over 92% of professionals admit to multitasking during meetings, leading to a decline in overall focus and productivity.",
    source: "University of California, Irvine"
  },
  {
    text: "71% of senior managers find meetings to be unproductive and inefficient.",
    source: "Harvard Business Review"
  },
  {
    text: "In the United States, it is estimated that businesses waste approximately $37 billion annually on unproductive meetings.",
    source: "Atlassian"
  },
  {
    text: "Approximately 63% of meetings are conducted without a predefined agenda, contributing to a lack of focus.",
    source: "Atlassian"
  },
  {
    text: "Around 67% of employees believe that too many meetings prevent them from completing their own work.",
    source: "Workfront"
  },
  {
    text: "Nearly 90% of meeting participants admit to daydreaming during meetings.",
    source: "Fuze"
  }
];

const ProductivityCalculator: React.FC = () => {
  const [meetings, setMeetings] = useState(10);
  const [emails, setEmails] = useState(50);
  const [multitasking, setMultitasking] = useState(60);
  const [currentQuote, setCurrentQuote] = useState(0);

  const prevQuote = () => {
    setCurrentQuote(currentQuote === 0 ? quotes.length - 1 : currentQuote - 1);
  };

  const nextQuote = () => {
    setCurrentQuote(currentQuote === quotes.length - 1 ? 0 : currentQuote + 1);
  };

  const stats = useMemo(() => {
    const unproductiveMeetingHours = meetings * 0.5;
    const focusTimeLost = (40 * (multitasking / 100)) * 0.4;
    const totalHoursReclaimed = unproductiveMeetingHours + focusTimeLost;
    
    return {
      unproductiveMeetingHours: unproductiveMeetingHours.toFixed(1),
      focusTimeLost: focusTimeLost.toFixed(1),
      totalHoursReclaimed: totalHoursReclaimed.toFixed(1),
    };
  }, [meetings, multitasking]);

  return (
    <section id="calculator" className="py-20">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Calculate Your Reclaimed Time</h2>
        <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-16">
          You can only be in one place at a time. See how much time you could save by replacing noise with a focused brief.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 items-center">
        {/* Sliders */}
        <div className="space-y-8 bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
          <Slider
            label="How many meetings do you attend weekly?"
            value={meetings}
            min={0}
            max={40}
            onChange={(e) => setMeetings(parseInt(e.target.value, 10))}
            unit="meetings"
          />
          <Slider
            label="How many emails/pings do you get daily?"
            value={emails}
            min={0}
            max={200}
            step={5}
            onChange={(e) => setEmails(parseInt(e.target.value, 10))}
            unit="messages"
          />
           <Slider
            label="What % of your week is spent multitasking?"
            value={multitasking}
            min={0}
            max={100}
            step={5}
            onChange={(e) => setMultitasking(parseInt(e.target.value, 10))}
            unit="%"
          />
        </div>

        {/* Results */}
        <div className="bg-gradient-to-br from-sky-900/50 to-slate-800/50 p-8 rounded-2xl border border-brand-blue/50 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
              <CalculatorIcon className="h-8 w-8 text-brand-blue" />
              <h3 className="text-2xl font-bold text-white">Your Potential Time Savings</h3>
          </div>
          <p className="text-slate-400 mb-8">Based on your week, here's an estimate of the time you could get back.</p>
          <div className="space-y-4 text-left">
              <div className="bg-slate-800 p-4 rounded-lg flex justify-between items-center">
                  <span className="text-slate-300">Unproductive Meeting Hours</span>
                  <span className="text-2xl font-bold text-brand-blue">{stats.unproductiveMeetingHours} <span className="text-base font-normal">hrs/wk</span></span>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg flex justify-between items-center">
                  <span className="text-slate-300">"Shallow Work" & Multitasking</span>
                  <span className="text-2xl font-bold text-brand-blue">{stats.focusTimeLost} <span className="text-base font-normal">hrs/wk</span></span>
              </div>
          </div>
          <div className="mt-8 border-t border-slate-700 pt-6">
            <p className="text-lg text-slate-300">Total Focused Time Reclaimed:</p>
            <p className="text-5xl font-extrabold text-white mt-2">
                {stats.totalHoursReclaimed}
                <span className="text-2xl font-semibold text-slate-400 ml-2">hours/week</span>
            </p>
             <p className="mt-4 text-sm text-slate-500">That's over <span className="font-bold text-slate-400">{(parseFloat(stats.totalHoursReclaimed) * 4).toFixed(0)} hours</span> a month to spend on deep work, strategy, and coaching your team.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-20">
        <h3 className="text-3xl font-bold text-white text-center mb-10">The High Cost of Noise</h3>
        <div className="relative max-w-3xl mx-auto bg-slate-800 p-8 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="relative min-h-[160px] flex flex-col items-center text-center">
                {quotes.map((quote, index) => (
                    <div key={index} className={`absolute w-full transition-opacity duration-500 ease-in-out ${index === currentQuote ? 'opacity-100' : 'opacity-0'}`}>
                        <QuoteIcon className="w-8 h-8 text-brand-blue mx-auto mb-4" />
                        <blockquote className="text-slate-300 text-lg md:text-xl leading-relaxed">
                            “{quote.text}”
                        </blockquote>
                        <footer className="mt-4 text-sm text-slate-500">- {quote.source}</footer>
                    </div>
                ))}
            </div>
            
            <button onClick={prevQuote} className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-700/50 p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="Previous quote">
                <ChevronLeftIcon className="w-6 h-6 text-white" />
            </button>
            <button onClick={nextQuote} className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-700/50 p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="Next quote">
                <ChevronRightIcon className="w-6 h-6 text-white" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {quotes.map((_, index) => (
                    <button 
                        key={index} 
                        onClick={() => setCurrentQuote(index)} 
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentQuote ? 'bg-brand-blue' : 'bg-slate-600 hover:bg-slate-500'}`}
                        aria-label={`Go to quote ${index + 1}`}
                    ></button>
                ))}
            </div>
        </div>
      </div>

    </section>
  );
};

export default ProductivityCalculator;

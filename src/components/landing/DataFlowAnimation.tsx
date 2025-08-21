'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MessageSquare, Calendar, Zap, CheckCircle } from 'lucide-react';

const inputTypes = [
  { icon: Mail, label: 'Emails', color: '#3b82f6' },
  { icon: MessageSquare, label: 'Slack', color: '#ec4899' },
  { icon: Calendar, label: 'Meetings', color: '#8b5cf6' },
];

const outputs = [
  '✅ Project Alpha: On track - 75% complete',
  '⚠️ Team Sync: Needs attention - Blocked on design',
  '📈 Q3 Goals: 3/5 KPIs achieved',
  '👥 1:1s: 3 pending action items',
  '🚀 New Initiative: Ready for review',
];

export function DataFlowAnimation() {
  const [activeOutput, setActiveOutput] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cycleOutputs = () => {
      setIsProcessing(true);
      setTimeout(() => {
        setActiveOutput(prev => (prev + 1) % outputs.length);
        setIsProcessing(false);
      }, 2000);
    };

    const interval = setInterval(cycleOutputs, 3500);
    intervalRef.current = interval;
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [outputs.length]);

  return (
    <div className="relative w-full max-w-4xl mx-auto h-64 my-16">
      {/* Input Icons */}
      <div className="flex justify-center space-x-8 mb-12">
        {inputTypes.map((input, i) => (
          <motion.div
            key={input.label}
            className="flex flex-col items-center"
            animate={isProcessing ? 'processing' : 'idle'}
            variants={{
              idle: { y: 0, opacity: 1 },
              processing: { 
                y: 40, 
                opacity: 0,
                transition: { delay: i * 0.2 }
              }
            }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-2"
              style={{ backgroundColor: `${input.color}15` }}
            >
              <input.icon className="w-6 h-6" style={{ color: input.color }} />
            </div>
            <span className="text-xs text-muted-foreground">{input.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Processing Animation */}
      <div className="flex justify-center my-4">
        <motion.div
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'linear',
            repeatType: 'loop'
          }}
        >
          <Zap className="w-6 h-6 text-primary" />
        </motion.div>
      </div>

      {/* Output */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeOutput}
          className="bg-background/80 backdrop-blur-sm border border-border rounded-lg p-4 max-w-md mx-auto shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{outputs[activeOutput]}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

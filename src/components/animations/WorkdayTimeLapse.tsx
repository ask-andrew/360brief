'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

type Notification = {
  id: number;
  type: 'email' | 'slack' | 'meeting';
  content: string;
  time: string;
};

const notifications = {
  email: [
    'Q2 Report Review',
    'Budget Approval Needed',
    'Team Meeting Notes',
    'Project Deadline'
  ],
  slack: [
    'Standup in 5m',
    'New in #general',
    'PR Review',
    '1:1 Reminder'
  ],
  meeting: [
    'Weekly Sync',
    'All Hands',
    'Team Lunch',
    'Performance Review'
  ]
};

const getRandomNotification = (time: string): Notification => {
  const type = ['email', 'slack', 'meeting'][Math.floor(Math.random() * 3)] as 'email' | 'slack' | 'meeting';
  const content = notifications[type][Math.floor(Math.random() * notifications[type].length)];
  return {
    id: Date.now() + Math.random(),
    type,
    content,
    time,
  };
};

export default function WorkdayTimeLapse() {
  const [items, setItems] = useState<Notification[]>([]);
  const [time, setTime] = useState('8:00 AM');
  const [isPaused, setIsPaused] = useState(false);
  const times = ['8:00 AM', '10:30 AM', '12:00 PM', '2:30 PM', '5:00 PM'];
  
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setItems(prev => [
        ...prev,
        getRandomNotification(time)
      ].slice(-15)); // Keep only last 15 items
      
      // Change time every 5 seconds
      if (Math.random() > 0.85) {
        setTime(times[Math.floor(Math.random() * times.length)]);
      }
    }, 800);
    
    return () => clearInterval(interval);
  }, [isPaused, time]);

  return (
    <div className="relative w-full max-w-md mx-auto h-96 bg-gray-50 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-sm">{time}</div>
        <button 
          onClick={() => setIsPaused(!isPaused)}
          className="text-xs bg-gray-700 px-2 py-1 rounded"
        >
          {isPaused ? '▶️' : '⏸️'}
        </button>
      </div>
      
      <div className="p-4 space-y-2 overflow-y-auto h-80">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`p-3 rounded-lg text-sm ${
                item.type === 'email' ? 'bg-blue-50 border-l-4 border-blue-500' :
                item.type === 'slack' ? 'bg-purple-50 border-l-4 border-purple-500' :
                'bg-green-50 border-l-4 border-green-500'
              }`}
            >
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="font-medium">
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </span>
                <span>{item.time}</span>
              </div>
              <div>{item.content}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
    </div>
  );
}

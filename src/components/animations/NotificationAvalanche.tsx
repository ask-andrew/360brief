'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon, 
  BellAlertIcon,
  VideoCameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

type NotificationType = 'email' | 'slack' | 'teams' | 'alert';

interface Notification {
  id: number;
  type: NotificationType;
  sender: string;
  preview: string;
  time: string;
  unread: boolean;
}

const notificationData = {
  email: {
    icon: EnvelopeIcon,
    color: 'bg-red-100 text-red-600',
    senders: ['Team', 'Client', 'HR', 'Finance', 'Updates'],
    previews: [
      'Action required: Q2 Report',
      'Meeting notes attached',
      'Review this document',
      'Schedule update',
      'Important announcement',
    ]
  },
  slack: {
    icon: ChatBubbleLeftRightIcon,
    color: 'bg-purple-100 text-purple-600',
    senders: ['#general', '#random', '#engineering', '#design', '#marketing'],
    previews: [
      'New message in thread',
      'Daily standup starting',
      'PR ready for review',
      'Team lunch tomorrow',
      'Reminder: All hands meeting',
    ]
  },
  teams: {
    icon: VideoCameraIcon,
    color: 'bg-blue-100 text-blue-600',
    senders: ['Sales Team', 'Management', 'Project X', '1:1', 'Company'],
    previews: [
      'Meeting starting soon',
      'New message',
      'You were mentioned',
      'Meeting recording available',
      'Team announcement',
    ]
  },
  alert: {
    icon: BellAlertIcon,
    color: 'bg-yellow-100 text-yellow-600',
    senders: ['System', 'Security', 'Update', 'Reminder', 'Alert'],
    previews: [
      'New login detected',
      'Storage almost full',
      'Update available',
      'Scheduled maintenance',
      'Security alert',
    ]
  }
};

const getRandomNotification = (id: number): Notification => {
  const types: NotificationType[] = ['email', 'slack', 'teams', 'alert'];
  const type = types[Math.floor(Math.random() * types.length)];
  const data = notificationData[type];
  
  return {
    id,
    type,
    sender: data.senders[Math.floor(Math.random() * data.senders.length)],
    preview: data.previews[Math.floor(Math.random() * data.previews.length)],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    unread: true
  };
};

export default function NotificationAvalanche() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const notificationCount = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate notifications at random intervals
  useEffect(() => {
    if (isPaused) return;

    const intervals = [800, 1200, 1500, 2000];
    const speeds = [0.8, 1, 1.2, 1.5];
    
    const interval = setInterval(() => {
      if (isPaused) return;
      
      const newNotification = getRandomNotification(notificationCount.current++);
      setNotifications(prev => [newNotification, ...prev].slice(0, 12));
      
      // Auto-scroll to bottom
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      
      // Random speed for next notification
      const nextInterval = intervals[Math.floor(Math.random() * intervals.length)];
      const speed = speeds[Math.floor(Math.random() * speeds.length)];
      
      clearInterval(interval);
      setTimeout(() => {
        const id = setInterval(() => {
          if (isPaused) return;
          const newNotification = getRandomNotification(notificationCount.current++);
          setNotifications(prev => [newNotification, ...prev].slice(0, 12));
          
          if (containerRef.current) {
            containerRef.current.scrollTop = 0;
          }
        }, nextInterval * speed);
        
        return () => clearInterval(id);
      }, 100);
      
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="relative w-full max-w-md mx-auto h-[500px] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
        </div>
        <h2 className="text-sm font-medium">Notifications</h2>
        <div className="flex space-x-2">
          <button 
            onClick={togglePause}
            className="text-gray-300 hover:text-white"
            aria-label={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          <button 
            onClick={clearAll}
            className="text-gray-300 hover:text-white text-sm"
          >
            Clear All
          </button>
        </div>
      </div>
      
      {/* Notification List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
      >
        <AnimatePresence>
          {notifications.map((notification) => {
            const Icon = notificationData[notification.type].icon;
            
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25
                }}
                className={`relative p-4 rounded-lg shadow-sm border-l-4 ${
                  notification.type === 'email' ? 'border-red-500' :
                  notification.type === 'slack' ? 'border-purple-500' :
                  notification.type === 'teams' ? 'border-blue-500' :
                  'border-yellow-500'
                } bg-white`}
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-full ${notificationData[notification.type].color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        {notification.sender}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {notification.preview}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  aria-label="Dismiss notification"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
                {notification.unread && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Footer */}
      <div className="p-3 bg-gray-100 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          {notifications.length} unread notification{notifications.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Overlay */}
      {showOverlay && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Notification Overload?</h3>
            <p className="text-gray-600 mb-4">
              360Brief consolidates all these notifications into one daily executive summary.
            </p>
            <button
              onClick={() => setShowOverlay(false)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { Zap, Clock, CheckCircle } from 'lucide-react';

const TimeSavingCalculator = () => {
  const [emails, setEmails] = useState(50);
  const [meetings, setMeetings] = useState(10);
  const [timeSaved, setTimeSaved] = useState(0);
  const [moneySaved, setMoneySaved] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Calculate time and money saved
  useEffect(() => {
    // Base calculations (adjust multipliers as needed)
    const emailTimeSaved = emails * 2; // 2 minutes per email
    const meetingTimeSaved = meetings * 15; // 15 minutes per meeting
    const totalMinutesSaved = emailTimeSaved + meetingTimeSaved;
    
    setTimeSaved(totalMinutesSaved);
    
    // Assuming $100/hour average executive time
    const hourlyRate = 100;
    const minutesInHour = 60;
    const money = (totalMinutesSaved / minutesInHour) * hourlyRate;
    setMoneySaved(Math.round(money * 100) / 100);
  }, [emails, meetings]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-4xl mx-auto transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Calculate Your Time Savings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="emails" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emails per day
            </label>
            <div className="relative">
              <input
                type="range"
                id="emails"
                min="10"
                max="200"
                step="5"
                value={emails}
                onChange={(e) => setEmails(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10</span>
                <span>50</span>
                <span>100</span>
                <span>150</span>
                <span>200+</span>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Current: {emails} emails/day
            </div>
          </div>

          <div>
            <label htmlFor="meetings" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weekly meetings
            </label>
            <div className="relative">
              <input
                type="range"
                id="meetings"
                min="0"
                max="30"
                step="1"
                value={meetings}
                onChange={(e) => setMeetings(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>10</span>
                <span>20</span>
                <span>30+</span>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Current: {meetings} meetings/week
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800/50">
          <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 text-yellow-500 mr-2" />
            Your Potential Savings
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Time saved per week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.floor(timeSaved / 60)}h {timeSaved % 60}m
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round((timeSaved / (5 * 8 * 60)) * 100)}% of a 40-hour workweek
                </p>
              </div>
            </div>

            <div className="flex items-start pt-4 border-t border-gray-200 dark:border-gray-700">
              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Annual value (time as money)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(moneySaved * 52).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Based on ${100}/hour executive time
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          These are estimates based on our user data. Your actual savings may vary.
        </p>
      </div>
    </div>
  );
};

export default TimeSavingCalculator;

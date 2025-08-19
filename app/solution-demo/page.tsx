'use client';

import { useState } from 'react';
import NotificationAvalanche from '@/components/animations/NotificationAvalanche';
import ExecutiveBrief from '@/components/animations/ExecutiveBrief';

export default function SolutionDemo() {
  const [showSolution, setShowSolution] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {showSolution ? 'Your Executive Command Center' : 'The Notification Avalanche'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {showSolution 
              ? 'How 360Brief transforms chaos into clarity'
              : 'This is what executive inbox overload looks like'}
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-6">
            {showSolution ? <ExecutiveBrief /> : <NotificationAvalanche />}
          </div>
          
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {showSolution 
                  ? 'Ready to transform your workflow?'
                  : 'There\'s a better way'}
              </h2>
              <p className="text-gray-600 mb-6">
                {showSolution 
                  ? 'Get started with 360Brief and experience the difference of focused, actionable executive briefings.'
                  : '360Brief consolidates all your notifications and projects into one clear, actionable executive summary.'}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  {showSolution ? '← Back to Problem' : 'See the Solution →'}
                </button>
                <button className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity">
                  Get Started Free
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Key Benefits */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Project Overview</h3>
            <p className="text-gray-600">See all your projects at a glance with clear status indicators and next steps.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Action Items</h3>
            <p className="text-gray-600">Quickly identify and address critical tasks that need your attention.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Save Time</h3>
            <p className="text-gray-600">Reduce time spent managing communications by up to 70%.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

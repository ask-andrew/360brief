'use client';

import { useState } from 'react';
import NotificationAvalanche from '@/components/animations/NotificationAvalanche';

export default function NotificationDemo() {
  const [showSolution, setShowSolution] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">The Notification Avalanche</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            This is what executive inbox overload looks like
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-6">
            <NotificationAvalanche />
          </div>
          
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Drowning in Notifications?</h2>
              <p className="text-gray-600 mb-6">
                Executives receive hundreds of notifications daily across multiple platforms. 
                360Brief consolidates this chaos into a single, actionable executive summary.
              </p>
              <button
                onClick={() => setShowSolution(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                See the 360Brief Solution
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {showSolution && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 relative">
            <button
              onClick={() => setShowSolution(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Your Executive Summary Awaits</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-blue-100 p-3 rounded-lg mr-4 flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">One Daily Brief, Not Hundreds of Alerts</h3>
                  <p className="text-gray-600 mt-1">Get a single, curated summary instead of constant interruptions.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-purple-100 p-3 rounded-lg mr-4 flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">All Channels, One Place</h3>
                  <p className="text-gray-600 mt-1">Email, Slack, Teams, and more - unified in one view.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 p-3 rounded-lg mr-4 flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Actionable Insights</h3>
                  <p className="text-gray-600 mt-1">Clear next steps and priorities highlighted for you.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <button
                onClick={() => setShowSolution(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
              >
                Get Started with 360Brief
              </button>
              <p className="mt-3 text-sm text-gray-500">
                No credit card required. Try it free for 14 days.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

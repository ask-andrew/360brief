'use client';

import { useState } from 'react';
import WorkdayTimeLapse from '@/components/animations/WorkdayTimeLapse';

export default function DemoPage() {
  const [showOverlay, setShowOverlay] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">The Executive's Daily Grind</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how quickly notifications can overwhelm your day
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <WorkdayTimeLapse />
          
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tired of the chaos?</h2>
              <p className="text-gray-600 mb-6">
                360Brief transforms this overwhelming flood into a clear, concise executive summary.
                Focus on what matters while we handle the noise.
              </p>
              <button
                onClick={() => setShowOverlay(true)}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                See How It Works
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {showOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 relative">
            <button
              onClick={() => setShowOverlay(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4">How 360Brief Helps</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Lightning-Fast Summaries</h3>
                  <p className="text-gray-600 text-sm">Get the key points from all your communications in seconds</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Privacy First</h3>
                  <p className="text-gray-600 text-sm">Your data stays secure with enterprise-grade encryption</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Never Miss What Matters</h3>
                  <p className="text-gray-600 text-sm">AI identifies and surfaces critical information across all your channels</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowOverlay(false)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

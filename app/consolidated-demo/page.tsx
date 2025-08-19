'use client';

import { motion } from 'framer-motion';
import ConsolidatedView from '@/components/animations/ConsolidatedView';

export default function ConsolidatedDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            From Chaos to Clarity
          </h1>
          <p className="text-gray-600">
            See how 360Brief transforms your notifications
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <ConsolidatedView />
          
          <div className="p-6 bg-gray-50 border-t text-center">
            <h2 className="text-xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-gray-600 mb-4">
              Transform your notifications into clear project updates.
            </p>
            <a
              href="/signup"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try 360Brief Free
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

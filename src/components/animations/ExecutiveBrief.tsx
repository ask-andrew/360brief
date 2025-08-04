'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const projects = [
  {
    id: '1',
    name: 'Q3 Product Launch',
    status: 'on_track',
    lastUpdated: '2h ago',
    owner: 'Alex Chen',
    priority: 'high',
    nextStep: 'Review final mockups',
  },
  {
    id: '2',
    name: 'Marketing Campaign',
    status: 'at_risk',
    lastUpdated: '1d ago',
    owner: 'Jamie Smith',
    priority: 'high',
    nextStep: 'Approve budget',
  },
  {
    id: '3',
    name: 'Infrastructure Upgrade',
    status: 'blocked',
    lastUpdated: '3h ago',
    owner: 'Taylor Wong',
    priority: 'medium',
    blockedReason: 'Vendor response needed',
  },
];

const statusConfig = {
  on_track: { icon: CheckCircleIcon, color: 'bg-green-100 text-green-800' },
  at_risk: { icon: ExclamationTriangleIcon, color: 'bg-yellow-100 text-yellow-800' },
  blocked: { icon: ArrowPathIcon, color: 'bg-red-100 text-red-800' }
};

export default function ExecutiveBrief() {
  const [activeTab, setActiveTab] = useState('projects');
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-2xl">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Your Executive Brief</h2>
        <p className="text-sm text-gray-500">Last updated: Just now</p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'projects' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Projects (3)
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'messages' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Action Items (2)
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {activeTab === 'projects' ? (
          <div className="space-y-4">
            {projects.map((project) => {
              const StatusIcon = statusConfig[project.status].icon;
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {project.status === 'blocked' 
                          ? `Blocked: ${project.blockedReason}` 
                          : `Next: ${project.nextStep}`}
                      </p>
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[project.status].color}`}>
                      <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                      {project.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <span>Owner: {project.owner}</span>
                    <span className="mx-2">•</span>
                    <span>Updated {project.lastUpdated}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-medium text-gray-900">Review Q3 Launch Designs</h3>
              <p className="text-sm text-gray-600 mt-1">Alex Chen needs your approval on final mockups</p>
              <div className="mt-2 text-xs text-gray-500">Project: Q3 Product Launch • 1h ago</div>
            </div>
            <div className="p-4 border rounded-lg bg-yellow-50">
              <h3 className="font-medium text-gray-900">Marketing Budget Approval</h3>
              <p className="text-sm text-gray-600 mt-1">Jamie Smith needs your input on budget increase</p>
              <div className="mt-2 text-xs text-gray-500">Project: Marketing Campaign • 3h ago</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 text-right border-t">
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          View Full Report
        </button>
      </div>
    </div>
  );
}

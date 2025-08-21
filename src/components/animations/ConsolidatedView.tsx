'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { 
  EnvelopeIcon, 
  ChatBubbleLeftIcon, 
  VideoCameraIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

// Types
interface Notification {
  id: string;
  type: 'email' | 'slack' | 'meeting';
  sender: string;
  project: string;
  content: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  requiresAction: boolean;
  status: 'pending' | 'urgent' | 'info';
}

interface ProjectUpdate {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'blocked' | 'completed' | 'scheduled';
  priority: 'high' | 'medium' | 'low';
}

interface Project {
  name: string;
  status: 'on_track' | 'at_risk' | 'blocked';
  lastUpdate: string;
  priority: 'high' | 'medium' | 'low';
  updates: ProjectUpdate[];
  team: string[];
  actionRequired: number;
}

export default function ConsolidatedView() {
  const [showConsolidated, setShowConsolidated] = useState(false);
  
  // Sample data
  const notifications: Notification[] = [
    { 
      id: '1', 
      type: 'email', 
      sender: 'alex@acme.com', 
      project: 'Q3 Launch', 
      content: 'Need your approval on the final mockups for the Q3 launch', 
      time: '10:30 AM',
      priority: 'high',
      requiresAction: true,
      status: 'pending'
    },
    { 
      id: '2', 
      type: 'slack', 
      sender: 'Jamie Smith', 
      project: 'Marketing Campaign', 
      content: 'Can we discuss the 15% budget increase for Q4?', 
      time: '11:15 AM',
      priority: 'high',
      requiresAction: true,
      status: 'pending'
    },
    { 
      id: '3', 
      type: 'meeting', 
      sender: 'Taylor Wong', 
      project: 'Infrastructure', 
      content: 'Security vulnerability found - needs immediate attention', 
      time: '2:00 PM',
      priority: 'high',
      requiresAction: true,
      status: 'urgent'
    },
    { 
      id: '4', 
      type: 'email', 
      sender: 'dev-team@acme.com', 
      project: 'Q3 Launch', 
      content: 'PR #1243: New checkout flow ready for review', 
      time: '2:30 PM',
      priority: 'medium',
      requiresAction: true,
      status: 'pending'
    },
    { 
      id: '5', 
      type: 'slack', 
      sender: 'Jordan Lee', 
      project: 'Customer Success', 
      content: 'Enterprise client onboarding call tomorrow at 2 PM', 
      time: '3:15 PM',
      priority: 'medium',
      requiresAction: false,
      status: 'info'
    },
    { 
      id: '6', 
      type: 'email', 
      sender: 'notifications@github.com', 
      project: 'Documentation', 
      content: 'New comment on PR #1245: Update API documentation', 
      time: '3:45 PM',
      priority: 'low',
      requiresAction: false,
      status: 'info'
    },
    { 
      id: '7',
      type: 'email',
      sender: 'hr@acme.com',
      project: 'Team',
      content: 'Quarterly performance reviews schedule is now available',
      time: '4:20 PM',
      priority: 'medium',
      requiresAction: true,
      status: 'pending'
    },
    { 
      id: '8',
      type: 'slack',
      sender: 'DevOps Alerts',
      project: 'Infrastructure',
      content: 'Scheduled maintenance window tonight 12AM-2AM',
      time: '4:45 PM',
      priority: 'medium',
      requiresAction: false,
      status: 'info'
    },
    { 
      id: '9',
      type: 'email',
      sender: 'legal@acme.com',
      project: 'Compliance',
      content: 'New data protection policy requires your review',
      time: '5:10 PM',
      priority: 'high',
      requiresAction: true,
      status: 'urgent'
    },
    { 
      id: '10',
      type: 'meeting',
      sender: 'Product Team',
      project: 'Q3 Launch',
      content: 'Beta testing results review - rescheduled to Friday',
      time: '5:30 PM',
      priority: 'medium',
      requiresAction: false,
      status: 'info'
    }
  ];

  const projects: Project[] = [
    {
      name: 'Q3 Launch',
      status: 'on_track',
      lastUpdate: 'Today, 2:30 PM',
      priority: 'high',
      updates: [
        { id: 'u1', content: 'Approve final mockups (Alex)', status: 'pending', priority: 'high' },
        { id: 'u2', content: 'Review PR #1243: New checkout flow', status: 'pending', priority: 'medium' },
        { id: 'u3', content: 'GTM meeting tomorrow at 10 AM', status: 'scheduled', priority: 'medium' }
      ],
      team: ['Alex Chen', 'Dev Team', 'Product', 'Design'],
      actionRequired: 2
    },
    {
      name: 'Marketing Campaign',
      status: 'at_risk',
      lastUpdate: 'Today, 11:15 AM',
      priority: 'high',
      updates: [
        { id: 'u4', content: 'Budget increase request: +15%', status: 'pending', priority: 'high' },
        { id: 'u5', content: 'Campaign assets in review', status: 'in_progress', priority: 'medium' },
        { id: 'u6', content: 'Influencer outreach - 3 pending responses', status: 'in_progress', priority: 'low' }
      ],
      team: ['Jamie Smith', 'Marketing Team', 'Design'],
      actionRequired: 1
    },
    {
      name: 'Infrastructure',
      status: 'blocked',
      lastUpdate: 'Today, 2:00 PM',
      priority: 'high',
      updates: [
        { id: 'u7', content: 'Critical security patch needed', status: 'blocked', priority: 'high' },
        { id: 'u8', content: 'Vendor contract expiring soon', status: 'pending', priority: 'medium' },
        { id: 'u9', content: 'Server upgrade scheduled for maintenance window', status: 'scheduled', priority: 'medium' }
      ],
      team: ['Taylor Wong', 'DevOps', 'Security'],
      actionRequired: 2
    },
    {
      name: 'Customer Success',
      status: 'on_track',
      lastUpdate: 'Today, 3:15 PM',
      priority: 'medium',
      updates: [
        { id: 'u10', content: 'Enterprise client onboarding call tomorrow', status: 'scheduled', priority: 'medium' },
        { id: 'u11', content: 'QBR with key accounts next week', status: 'in_progress', priority: 'low' }
      ],
      team: ['Jordan Lee', 'Customer Success'],
      actionRequired: 0
    },
    {
      name: 'Team & Culture',
      status: 'on_track',
      lastUpdate: 'Today, 4:20 PM',
      priority: 'medium',
      updates: [
        { id: 'u12', content: 'Quarterly performance reviews schedule ready', status: 'pending', priority: 'medium' },
        { id: 'u13', content: 'Team offsite planning in progress', status: 'in_progress', priority: 'low' }
      ],
      team: ['HR Team', 'All Managers'],
      actionRequired: 1
    }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {showConsolidated ? 'Consolidated View' : 'Raw Notifications'}
        </h3>
        <button
          onClick={() => setShowConsolidated(!showConsolidated)}
          className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
        >
          {showConsolidated ? 'Show Raw' : 'Show Consolidated'}
        </button>
      </div>

      {!showConsolidated ? (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 border rounded-lg bg-white"
            >
              <div className="flex items-center gap-3">
                {notif.type === 'email' && <EnvelopeIcon className="h-5 w-5 text-gray-500" />}
                {notif.type === 'slack' && <ChatBubbleLeftIcon className="h-5 w-5 text-purple-500" />}
                {notif.type === 'meeting' && <VideoCameraIcon className="h-5 w-5 text-blue-500" />}
                <div>
                  <p className="text-sm"><span className="font-medium">{notif.sender}:</span> {notif.content}</p>
                  <span className="text-xs text-gray-500">{notif.time} • {notif.project}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border rounded-lg bg-white"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{project.name}</h4>
                  <p className="text-sm text-gray-500">Updated: {project.lastUpdate}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  project.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {project.priority} priority
                </span>
              </div>
              
              <div className="mt-3">
                <h5 className="text-sm font-medium text-gray-700 mb-1">Next Steps:</h5>
                <ul className="space-y-1">
                  {project.updates.map((step, i) => (
                    <li key={i} className="flex items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-300 mt-2 mr-2"></span>
                      <span className="text-sm">{step.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

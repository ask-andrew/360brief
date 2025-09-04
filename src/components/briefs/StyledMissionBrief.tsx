'use client';

import { Badge } from '@/components/ui/badge';
import { Clock, Mail, Calendar, AlertTriangle, Star, Trophy } from 'lucide-react';

interface MissionBriefData {
  currentStatus?: {
    primaryIssue: string;
    businessImpact?: string[];
  };
  immediateActions?: Array<{
    title: string;
    objective: string;
    owner?: string;
    priority: 'High' | 'Medium' | 'Low';
    type: 'email' | 'calendar' | 'action';
    from?: string;
    to?: string;
    location?: string;
    time?: string;
    date?: string;
  }>;
  requiredActions?: string[];
  trends?: string[];
  winbox?: Array<{
    name: string;
    achievement: string;
    impact?: string;
    type?: 'ahead_of_schedule' | 'project_advance' | 'team_collaboration' | 'innovation';
  }>;
}

interface StyledMissionBriefProps {
  data: MissionBriefData;
  generatedAt: string;
  dataSource: 'real' | 'mock';
}

export function StyledMissionBrief({ data, generatedAt, dataSource }: StyledMissionBriefProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Your 360 Brief</h1>
          <div className="h-1 w-20 bg-blue-500 mx-auto rounded-sm"></div>
        </div>
      </div>
      
      {/* Brief Container */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Brief Header */}
        <div className="bg-gray-50 border-b-2 border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 m-0">MISSION BRIEF</h2>
          <div className="text-sm text-gray-600 mt-1">
            {formatDate(generatedAt)}
          </div>
        </div>
        
        {/* Executive Summary */}
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <h3 className="font-semibold text-gray-900 m-0">EXECUTIVE SUMMARY</h3>
          </div>
          <p className="text-gray-700 m-0">
            {data.currentStatus?.primaryIssue || 'Critical updates requiring immediate attention on key projects and operational priorities.'}
          </p>
        </div>
        
        {/* Priority Items */}
        <div className="px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">PRIORITY ITEMS</h3>
          
          <div className="space-y-4">
            {data.immediateActions?.map((action, index) => (
              <div key={index} className="flex gap-3 py-3 border-b border-gray-100 last:border-b-0">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  action.type === 'email' ? 'bg-blue-100 text-blue-600' : 
                  action.type === 'calendar' ? 'bg-green-100 text-green-600' : 
                  'bg-purple-100 text-purple-600'
                }`}>
                  {action.type === 'email' && <Mail className="w-4 h-4" />}
                  {action.type === 'calendar' && <Calendar className="w-4 h-4" />}
                  {action.type === 'action' && <AlertTriangle className="w-4 h-4" />}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 m-0">{action.title}</h4>
                    <Badge 
                      variant={action.priority === 'High' ? 'destructive' : 
                               action.priority === 'Medium' ? 'default' : 'secondary'}
                      className={`text-xs ${
                        action.priority === 'High' ? 'bg-red-100 text-red-700 border-red-300' :
                        action.priority === 'Medium' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                        'bg-green-100 text-green-700 border-green-300'
                      }`}
                    >
                      {action.priority}
                    </Badge>
                    <Badge className="bg-pink-100 text-pink-700 border-pink-300 text-xs">
                      Action Required
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-1">
                    {action.from && `From: ${action.from}`}
                    {action.to && `To: ${action.to}`}
                    {action.location && `Location: ${action.location}`}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <Clock className="w-3 h-3" />
                    {action.date && action.time ? 
                      `${action.date} • ${action.time}` : 
                      formatTime(generatedAt)
                    }
                  </div>
                  
                  <p className="text-sm text-gray-700 m-0">{action.objective}</p>
                </div>
              </div>
            ))}
            
            {/* Fallback if no actions */}
            {(!data.immediateActions || data.immediateActions.length === 0) && (
              <>
                <div className="flex gap-3 py-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 m-0">URGENT: Q3 Launch Planning Review</h4>
                      <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">High</Badge>
                      <Badge className="bg-pink-100 text-pink-700 border-pink-300 text-xs">Action Required</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">From: product@company.com</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Clock className="w-3 h-3" />
                      {formatDate(generatedAt)} • {formatTime(generatedAt)}
                    </div>
                    <p className="text-sm text-gray-700 m-0">
                      Critical path dependencies require executive decision on scope and timeline adjustments for Q3 product launch.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 py-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 m-0">Leadership Review Meeting</h4>
                      <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">High</Badge>
                      <Badge className="bg-pink-100 text-pink-700 border-pink-300 text-xs">Action Required</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Location: Conference Room A</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Clock className="w-3 h-3" />
                      {formatDate(generatedAt)} • 2:00 PM • 60 min
                    </div>
                    <p className="text-sm text-gray-700 m-0">
                      Final review of project timeline with department heads. Present updated priorities and resource allocation.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Required Actions */}
        <div className="px-6 py-4 border-t border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">REQUIRED ACTIONS</h3>
          <div className="space-y-2">
            {data.requiredActions?.map((action, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold text-sm min-w-[20px]">{index + 1}.</span>
                <span className="text-sm text-gray-700">{action}</span>
              </div>
            )) || (
              <>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold text-sm min-w-[20px]">1.</span>
                  <span className="text-sm text-gray-700">Review and approve Q3 launch timeline adjustments by EOD</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold text-sm min-w-[20px]">2.</span>
                  <span className="text-sm text-gray-700">Provide feedback on resource allocation for critical path items</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold text-sm min-w-[20px]">3.</span>
                  <span className="text-sm text-gray-700">Prepare talking points for leadership review meeting</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Winbox - Team Kudos & Achievements */}
        <div className="bg-green-50 border-t border-green-200 px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900 m-0">WINBOX - TEAM ACHIEVEMENTS</h3>
          </div>
          <div className="space-y-3">
            {data.winbox?.map((win, index) => (
              <div key={index} className="bg-white border-l-4 border-green-500 p-3 rounded-r-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-gray-900">{win.name}</span>
                      {win.type && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {win.type === 'ahead_of_schedule' ? 'Ahead of Schedule' :
                           win.type === 'project_advance' ? 'Project Advance' :
                           win.type === 'team_collaboration' ? 'Team Collaboration' : 
                           'Innovation'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{win.achievement}</p>
                    {win.impact && (
                      <p className="text-xs text-gray-600 italic">Impact: {win.impact}</p>
                    )}
                  </div>
                </div>
              </div>
            )) || (
              <>
                <div className="bg-white border-l-4 border-green-500 p-3 rounded-r-lg shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-gray-900">Sarah Chen (Engineering)</span>
                        <Badge className="bg-green-100 text-green-800 text-xs">Ahead of Schedule</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">Delivered API integration 3 days ahead of schedule</p>
                      <p className="text-xs text-gray-600 italic">Impact: Unblocked mobile team and Q3 launch timeline</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border-l-4 border-green-500 p-3 rounded-r-lg shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-gray-900">Marcus Williams (Design)</span>
                        <Badge className="bg-green-100 text-green-800 text-xs">Innovation</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">Proposed new user onboarding flow that increased conversion by 23%</p>
                      <p className="text-xs text-gray-600 italic">Impact: Projected +$50K monthly recurring revenue</p>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800 font-medium">💡 Consider sending kudos to recognize these achievements</p>
            </div>
          </div>
        </div>

        {/* Trends & Patterns */}
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">TRENDS & PATTERNS</h3>
          <div className="space-y-1">
            {data.trends?.map((trend, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-700">{trend}</span>
              </div>
            )) || (
              <>
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">•</span>
                  <span className="text-sm text-gray-700">
                    {dataSource === 'real' ? 'Increased urgency around project deliverables' : '3+ mentions of project timeline concerns across communications'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">•</span>
                  <span className="text-sm text-gray-700">
                    {dataSource === 'real' ? 'Multiple stakeholders requesting status updates' : '2 pending approvals requiring executive attention'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">•</span>
                  <span className="text-sm text-gray-700">
                    {dataSource === 'real' ? 'Team coordination improvements needed' : 'Increased focus on resource allocation efficiency'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-right">
          <span className="text-xs text-gray-600">
            Generated by 360Brief • {formatDate(generatedAt)}
          </span>
        </div>
      </div>
      
      {/* Footer Message */}
      <div className="mt-10 text-center text-gray-600 text-sm">
        <p className="mb-2">
          {dataSource === 'real' ? 
            'This brief includes insights from your connected Gmail account.' :
            'This is a preview of what your 360 Brief will look like.'
          }
        </p>
        <p>
          {dataSource === 'real' ? 
            'Connect more services for comprehensive executive insights.' :
            'Your actual brief will include personalized insights from your connected accounts.'
          }
        </p>
      </div>
    </div>
  );
}
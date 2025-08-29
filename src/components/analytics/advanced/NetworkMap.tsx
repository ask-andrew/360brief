'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Network, 
  Users, 
  Building2, 
  MessageSquare,
  Filter,
  Search,
  ExternalLink
} from 'lucide-react';

interface NetworkNode {
  id: string;
  name: string;
  email: string;
  type: 'self' | 'internal' | 'external' | 'client';
  messageCount: number;
  department?: string;
  company?: string;
  lastContact: string;
  projects: string[];
  sentiment?: number;
}

interface NetworkLink {
  source: string;
  target: string;
  weight: number; // Number of messages
  projects: string[];
  sentiment?: number;
  recentActivity: boolean;
}

interface Project {
  id: string;
  name: string;
  participants: string[];
  messageCount: number;
  status: 'active' | 'completed' | 'on-hold';
  priority: 'high' | 'medium' | 'low';
}

// Mock data representing an executive's communication network
const mockNetworkData = {
  nodes: [
    {
      id: 'self',
      name: 'You',
      email: 'you@company.com',
      type: 'self' as const,
      messageCount: 156,
      department: 'Executive',
      company: 'Your Company',
      lastContact: '2024-01-29',
      projects: ['q4-planning', 'client-expansion', 'team-growth'],
      sentiment: 0.1
    },
    {
      id: 'sarah-chen',
      name: 'Sarah Chen',
      email: 'sarah@acmecorp.com',
      type: 'client' as const,
      messageCount: 45,
      company: 'Acme Corp',
      lastContact: '2024-01-28',
      projects: ['client-expansion'],
      sentiment: -0.2
    },
    {
      id: 'mike-rodriguez',
      name: 'Mike Rodriguez',
      email: 'mike@company.com',
      type: 'internal' as const,
      messageCount: 38,
      department: 'Engineering',
      company: 'Your Company',
      lastContact: '2024-01-29',
      projects: ['q4-planning', 'platform-upgrade'],
      sentiment: 0.4
    },
    {
      id: 'finance-team',
      name: 'Finance Team',
      email: 'finance@company.com',
      type: 'internal' as const,
      messageCount: 28,
      department: 'Finance',
      company: 'Your Company',
      lastContact: '2024-01-27',
      projects: ['q4-planning'],
      sentiment: -0.1
    },
    {
      id: 'alex-johnson',
      name: 'Alex Johnson',
      email: 'alex@techpartner.com',
      type: 'external' as const,
      messageCount: 22,
      company: 'Tech Partner Inc',
      lastContact: '2024-01-25',
      projects: ['platform-upgrade'],
      sentiment: 0.3
    }
  ] as NetworkNode[],
  
  links: [
    { source: 'self', target: 'sarah-chen', weight: 45, projects: ['client-expansion'], sentiment: -0.2, recentActivity: true },
    { source: 'self', target: 'mike-rodriguez', weight: 38, projects: ['q4-planning', 'platform-upgrade'], sentiment: 0.4, recentActivity: true },
    { source: 'self', target: 'finance-team', weight: 28, projects: ['q4-planning'], sentiment: -0.1, recentActivity: false },
    { source: 'self', target: 'alex-johnson', weight: 22, projects: ['platform-upgrade'], sentiment: 0.3, recentActivity: false },
    { source: 'mike-rodriguez', target: 'alex-johnson', weight: 15, projects: ['platform-upgrade'], sentiment: 0.2, recentActivity: true },
    { source: 'mike-rodriguez', target: 'finance-team', weight: 12, projects: ['q4-planning'], sentiment: 0.1, recentActivity: false }
  ] as NetworkLink[],
  
  projects: [
    {
      id: 'q4-planning',
      name: 'Q4 Planning',
      participants: ['self', 'mike-rodriguez', 'finance-team'],
      messageCount: 78,
      status: 'active' as const,
      priority: 'high' as const
    },
    {
      id: 'client-expansion',
      name: 'Client Expansion',
      participants: ['self', 'sarah-chen'],
      messageCount: 45,
      status: 'active' as const,
      priority: 'high' as const
    },
    {
      id: 'platform-upgrade',
      name: 'Platform Upgrade',
      participants: ['self', 'mike-rodriguez', 'alex-johnson'],
      messageCount: 60,
      status: 'active' as const,
      priority: 'medium' as const
    }
  ] as Project[]
};

interface NetworkMapProps {
  width?: number;
  height?: number;
}

export function NetworkMap({ width = 800, height = 600 }: NetworkMapProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const data = mockNetworkData;
  
  // Filter data based on selected project
  const filteredData = selectedProject 
    ? {
        nodes: data.nodes.filter(node => 
          node.projects.includes(selectedProject) || node.id === 'self'
        ),
        links: data.links.filter(link => 
          link.projects.includes(selectedProject)
        )
      }
    : data;

  const getNodeColor = (node: NetworkNode) => {
    if (node.id === 'self') return '#4f46e5'; // Indigo
    if (node.type === 'client') return '#dc2626'; // Red
    if (node.type === 'external') return '#7c3aed'; // Purple
    return '#059669'; // Green for internal
  };

  const getNodeSize = (messageCount: number) => {
    const baseSize = 20;
    const maxSize = 60;
    const scale = Math.min(messageCount / 50, 1);
    return baseSize + (maxSize - baseSize) * scale;
  };

  const getLinkOpacity = (link: NetworkLink) => {
    return link.recentActivity ? 0.8 : 0.3;
  };

  const getLinkWidth = (weight: number) => {
    return Math.max(1, Math.min(weight / 10, 8));
  };

  // Simple force-directed layout (simplified for demo)
  const getNodePosition = (nodeId: string, index: number, total: number) => {
    if (nodeId === 'self') {
      return { x: width / 2, y: height / 2 };
    }
    
    const angle = (index * 2 * Math.PI) / (total - 1);
    const radius = Math.min(width, height) * 0.3;
    return {
      x: width / 2 + radius * Math.cos(angle),
      y: height / 2 + radius * Math.sin(angle)
    };
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Communication Network
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={selectedProject === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedProject(null)}
              >
                All Projects
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Project Filter */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Filter by project:</span>
              {data.projects.map((project) => (
                <Button
                  key={project.id}
                  variant={selectedProject === project.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedProject(
                    selectedProject === project.id ? null : project.id
                  )}
                  className="flex items-center gap-1"
                >
                  <Badge 
                    variant="secondary" 
                    className={`w-2 h-2 p-0 ${
                      project.priority === 'high' ? 'bg-red-500' :
                      project.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                  />
                  {project.name}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({project.messageCount})
                  </span>
                </Button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-indigo-600"></div>
                <span>You</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-600"></div>
                <span>Internal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-600"></div>
                <span>Client</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                <span>External</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Visualization */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <svg
              ref={svgRef}
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              className="border rounded-lg bg-gray-50"
            >
              {/* Links */}
              {filteredData.links.map((link, index) => {
                const sourceNode = filteredData.nodes.find(n => n.id === link.source);
                const targetNode = filteredData.nodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode) return null;
                
                const sourcePos = getNodePosition(link.source, 
                  filteredData.nodes.findIndex(n => n.id === link.source), 
                  filteredData.nodes.length
                );
                const targetPos = getNodePosition(link.target,
                  filteredData.nodes.findIndex(n => n.id === link.target),
                  filteredData.nodes.length
                );
                
                return (
                  <line
                    key={`link-${index}`}
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={link.recentActivity ? "#4f46e5" : "#d1d5db"}
                    strokeWidth={getLinkWidth(link.weight)}
                    strokeOpacity={getLinkOpacity(link)}
                  />
                );
              })}
              
              {/* Nodes */}
              {filteredData.nodes.map((node, index) => {
                const pos = getNodePosition(node.id, index, filteredData.nodes.length);
                const nodeSize = getNodeSize(node.messageCount);
                
                return (
                  <g key={node.id}>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={nodeSize / 2}
                      fill={getNodeColor(node)}
                      stroke={hoveredNode === node.id ? "#000" : "white"}
                      strokeWidth={hoveredNode === node.id ? 3 : 2}
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                    
                    {/* Node label */}
                    <text
                      x={pos.x}
                      y={pos.y + nodeSize / 2 + 16}
                      textAnchor="middle"
                      className="text-xs font-medium fill-gray-700"
                    >
                      {node.name.split(' ')[0]}
                    </text>
                    
                    {/* Message count */}
                    <text
                      x={pos.x}
                      y={pos.y + nodeSize / 2 + 28}
                      textAnchor="middle"
                      className="text-xs fill-gray-500"
                    >
                      {node.messageCount}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover tooltip */}
            {hoveredNode && (
              <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border max-w-xs">
                {(() => {
                  const node = filteredData.nodes.find(n => n.id === hoveredNode);
                  if (!node) return null;
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getNodeColor(node) }}
                        />
                        <span className="font-medium">{node.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><MessageSquare className="w-3 h-3 inline mr-1" />{node.messageCount} messages</p>
                        {node.company && (
                          <p><Building2 className="w-3 h-3 inline mr-1" />{node.company}</p>
                        )}
                        <p>Projects: {node.projects.length}</p>
                        <Button 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => window.location.href = `mailto:${node.email}`}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle>Project: {data.projects.find(p => p.id === selectedProject)?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const project = data.projects.find(p => p.id === selectedProject);
              if (!project) return null;
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={project.priority === 'high' ? 'destructive' : project.priority === 'medium' ? 'default' : 'secondary'}
                    >
                      {project.priority} priority
                    </Badge>
                    <Badge variant="outline">{project.status}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {project.messageCount} total messages
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Active Participants</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {project.participants.map(participantId => {
                        const participant = data.nodes.find(n => n.id === participantId);
                        if (!participant) return null;
                        
                        return (
                          <div key={participantId} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getNodeColor(participant) }}
                            />
                            <div>
                              <p className="text-sm font-medium">{participant.name}</p>
                              <p className="text-xs text-muted-foreground">{participant.email}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
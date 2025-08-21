// Define types for network data
export type NetworkNode = {
  id: string;
  name: string;
  email?: string;
  is_external?: boolean;
  messageCount?: number;
  symbolSize?: number;
  category?: number;
  value?: number;
  label?: {
    show?: boolean;
  };
};

export type NetworkLink = {
  source: string;
  target: string;
  weight?: number;
  lineStyle?: {
    width?: number;
    opacity?: number;
    curveness?: number;
  };
  isProjectLink?: boolean;
};

export type Project = {
  id: string;
  name: string;
  participants: string[];
  messageCount: number;
};

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
  projects?: Project[];
}

// Generate mock network data with projects
export const mockNetworkData: NetworkData = {
  nodes: [
    { id: 'user1', name: 'Alex Johnson', email: 'alex@example.com', is_external: false, messageCount: 25 },
    { id: 'user2', name: 'Jamie Smith', email: 'jamie@example.com', is_external: false, messageCount: 18 },
    { id: 'user3', name: 'Taylor Wong', email: 'taylor@example.com', is_external: false, messageCount: 12 },
    { id: 'user4', name: 'Casey Kim', email: 'casey@example.com', is_external: false, messageCount: 8 },
    { id: 'user5', name: 'Sam Wilson', email: 'sam@example.com', is_external: true, messageCount: 15 },
    { id: 'user6', name: 'Morgan Lee', email: 'morgan@example.com', is_external: false, messageCount: 22 },
  ],
  links: [
    { source: 'user1', target: 'user2', weight: 5 },
    { source: 'user1', target: 'user3', weight: 3 },
    { source: 'user1', target: 'user4', weight: 2 },
    { source: 'user2', target: 'user3', weight: 4 },
    { source: 'user2', target: 'user5', weight: 1 },
    { source: 'user3', target: 'user6', weight: 3 },
    { source: 'user4', target: 'user6', weight: 2 },
  ],
  projects: [
    {
      id: 'proj1',
      name: 'Product Roadmap',
      participants: ['user1', 'user2', 'user3'],
      messageCount: 45
    },
    {
      id: 'proj2',
      name: 'Customer Experience',
      participants: ['user1', 'user4', 'user6'],
      messageCount: 32
    },
    {
      id: 'proj3',
      name: 'Platform Integration',
      participants: ['user2', 'user3', 'user5'],
      messageCount: 28
    },
    {
      id: 'proj4',
      name: 'Marketing Campaign',
      participants: ['user1', 'user5', 'user6'],
      messageCount: 18
    }
  ]
};

// Function to get project-focused data
export const getProjectNetworkData = (projectId?: string): NetworkData => {
  if (!projectId) return mockNetworkData;
  
  const project = mockNetworkData.projects?.find(p => p.id === projectId);
  if (!project) return mockNetworkData;

  // Filter nodes and links to only include project participants
  const participantIds = new Set(project.participants);
  const filteredNodes = mockNetworkData.nodes?.filter(node => participantIds.has(node.id)) || [];
  
  // Add project as a node
  const projectNode = {
    id: `project-${project.id}`,
    name: project.name,
    isProject: true,
    symbolSize: 20 + Math.min(project.messageCount / 2, 30)
  };

  // Create links between project and participants
  const projectLinks = project.participants.map(participantId => ({
    source: `project-${project.id}`,
    target: participantId,
    isProjectLink: true
  }));

  return {
    nodes: [...filteredNodes, projectNode],
    links: projectLinks,
    projects: [project]
  };
};

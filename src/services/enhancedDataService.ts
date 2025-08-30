import { UnifiedData } from '@/types/unified';
import { fetchUnifiedData, FetchUnifiedOptions } from './unifiedDataService';

// Extended data source types for future integrations
export interface ExtendedDataSources {
  notes?: NoteItem[];
  transcripts?: TranscriptItem[];
  chats?: ChatItem[];
  documents?: DocumentItem[];
  tasks?: TaskItem[];
  crm?: CRMItem[];
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  source: 'notion' | 'obsidian' | 'roam' | 'logseq' | 'markdown' | 'other';
}

export interface TranscriptItem {
  id: string;
  title: string;
  content: string;
  participants: string[];
  duration?: number; // in minutes
  recordedAt: string;
  source: 'zoom' | 'teams' | 'meet' | 'loom' | 'otter' | 'other';
  keyTopics?: string[];
  actionItems?: string[];
}

export interface ChatItem {
  id: string;
  message: string;
  sender: string;
  timestamp: string;
  channel: string;
  thread?: string;
  reactions?: Array<{ emoji: string; count: number }>;
  source: 'slack' | 'discord' | 'teams' | 'whatsapp' | 'telegram' | 'other';
  mentions?: string[];
}

export interface DocumentItem {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  lastModified: string;
  author: string;
  collaborators?: string[];
  source: 'google_docs' | 'confluence' | 'notion' | 'sharepoint' | 'other';
  version?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  source: 'todoist' | 'asana' | 'monday' | 'clickup' | 'linear' | 'other';
  project?: string;
  labels?: string[];
}

export interface CRMItem {
  id: string;
  type: 'contact' | 'deal' | 'activity' | 'note';
  title: string;
  description?: string;
  amount?: number; // for deals
  stage?: string; // for deals
  contactName?: string;
  company?: string;
  lastInteraction?: string;
  nextAction?: string;
  source: 'salesforce' | 'hubspot' | 'pipedrive' | 'airtable' | 'other';
}

export interface EnhancedUnifiedData extends UnifiedData {
  extended?: ExtendedDataSources;
}

export type DataSource = 
  | 'gmail' 
  | 'calendar' 
  | 'notion' 
  | 'slack' 
  | 'zoom' 
  | 'salesforce' 
  | 'linear'
  | 'asana'
  | 'confluence'
  | 'github'
  | 'jira';

export interface FetchEnhancedOptions extends FetchUnifiedOptions {
  sources?: DataSource[];
  includeMockData?: boolean;
  scenario?: 'normal' | 'crisis' | 'high_activity';
}

// Main function to fetch enhanced unified data
export async function fetchEnhancedUnifiedData(
  userId?: string, 
  options: FetchEnhancedOptions = {}
): Promise<EnhancedUnifiedData> {
  // Get base unified data (Gmail + Calendar)
  const baseData = await fetchUnifiedData(userId, options);
  
  // Initialize enhanced data structure
  const enhanced: EnhancedUnifiedData = {
    ...baseData,
    extended: {
      notes: [],
      transcripts: [],
      chats: [],
      documents: [],
      tasks: [],
      crm: []
    }
  };

  // If mock data requested, return mock extended data
  if (options.includeMockData) {
    enhanced.extended = generateMockExtendedData(options.scenario);
    return enhanced;
  }

  // Fetch from additional sources if requested
  if (options.sources) {
    for (const source of options.sources) {
      try {
        switch (source) {
          case 'notion':
            enhanced.extended!.notes = await fetchNotionData(userId);
            break;
          case 'slack':
            enhanced.extended!.chats = await fetchSlackData(userId);
            break;
          case 'zoom':
            enhanced.extended!.transcripts = await fetchZoomTranscripts(userId);
            break;
          case 'salesforce':
            enhanced.extended!.crm = await fetchSalesforceData(userId);
            break;
          case 'linear':
            // Merge with existing tickets
            const linearTasks = await fetchLinearData(userId);
            enhanced.tickets = [...enhanced.tickets, ...linearTasks];
            break;
          case 'asana':
            enhanced.extended!.tasks = await fetchAsanaData(userId);
            break;
          case 'confluence':
            enhanced.extended!.documents = await fetchConfluenceData(userId);
            break;
          case 'github':
            // Could extend incidents or create new category
            break;
          case 'jira':
            // Could extend tickets
            break;
        }
      } catch (error) {
        console.warn(`Failed to fetch data from ${source}:`, error);
      }
    }
  }

  return enhanced;
}

// Mock data generators for different scenarios
function generateMockExtendedData(scenario?: string): ExtendedDataSources {
  const base: ExtendedDataSources = {
    notes: [
      {
        id: 'note-1',
        title: 'Weekly Strategy Notes',
        content: 'Key insights from leadership meeting: Focus on customer retention, invest in automation.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['strategy', 'leadership'],
        source: 'notion'
      }
    ],
    chats: [
      {
        id: 'chat-1',
        message: 'Great work on the client presentation! Really impressed with the engagement metrics.',
        sender: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        channel: '#wins',
        source: 'slack'
      }
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Prepare Q4 Board Presentation',
        status: 'in_progress',
        priority: 'high',
        assignee: 'Leadership Team',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'asana',
        project: 'Q4 Planning'
      }
    ]
  };

  if (scenario === 'crisis') {
    base.chats!.push({
      id: 'chat-crisis-1',
      message: 'All hands on deck - TechFlow situation needs immediate attention',
      sender: 'Incident Commander',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      channel: '#incident-response',
      source: 'slack',
      mentions: ['@here']
    });
    
    base.transcripts = [{
      id: 'transcript-1',
      title: 'Emergency Response Call - TechFlow Incident',
      content: 'Key decisions: 1) Activate DR plan 2) Customer communication within 1 hour 3) All hands meeting at 2pm',
      participants: ['CEO', 'CTO', 'VP Operations', 'Head of Customer Success'],
      duration: 45,
      recordedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      source: 'zoom',
      actionItems: ['Activate disaster recovery', 'Send customer communication', 'Schedule all-hands']
    }];
  }

  return base;
}

// Placeholder functions for future integrations
async function fetchNotionData(userId?: string): Promise<NoteItem[]> {
  // Future: Implement Notion API integration
  return [];
}

async function fetchSlackData(userId?: string): Promise<ChatItem[]> {
  // Future: Implement Slack API integration
  return [];
}

async function fetchZoomTranscripts(userId?: string): Promise<TranscriptItem[]> {
  // Future: Implement Zoom API integration
  return [];
}

async function fetchSalesforceData(userId?: string): Promise<CRMItem[]> {
  // Future: Implement Salesforce API integration
  return [];
}

async function fetchLinearData(userId?: string): Promise<any[]> {
  // Future: Implement Linear API integration
  return [];
}

async function fetchAsanaData(userId?: string): Promise<TaskItem[]> {
  // Future: Implement Asana API integration
  return [];
}

async function fetchConfluenceData(userId?: string): Promise<DocumentItem[]> {
  // Future: Implement Confluence API integration
  return [];
}

// Utility function to get available data sources for a user
export async function getAvailableDataSources(userId: string): Promise<DataSource[]> {
  const available: DataSource[] = ['gmail', 'calendar']; // Always available
  
  // Future: Check which integrations are connected for this user
  // This would query the database for user's connected services
  
  return available;
}

// Utility function to get data source health/status
export interface DataSourceStatus {
  source: DataSource;
  connected: boolean;
  lastSync?: string;
  error?: string;
}

export async function getDataSourcesStatus(userId: string): Promise<DataSourceStatus[]> {
  // Future: Implement health checks for all connected data sources
  return [
    { source: 'gmail', connected: true, lastSync: new Date().toISOString() },
    { source: 'calendar', connected: true, lastSync: new Date().toISOString() },
    { source: 'notion', connected: false },
    { source: 'slack', connected: false },
  ];
}
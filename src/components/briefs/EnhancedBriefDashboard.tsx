'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  Settings,
  Download,
  Mail,
  Calendar,
  MessageSquare,
  Zap,
  Building,
  Newspaper,
  Target,
  Briefcase,
  Info,
  Code,
  ChevronDown
} from 'lucide-react';
import { StyledMissionBrief } from './StyledMissionBrief';

interface BriefData {
  userId: string;
  generatedAt: string;
  style: string;
  subject: string;
  tldr: string;
  dataSource: 'real' | 'mock' | 'custom' | 'error';
  warning?: string;
  availableStyles?: string[];
  availableScenarios?: string[];
  scenario?: string;
  missionBrief?: any;
  startupVelocity?: any;
  consulting?: any;
  newsletter?: any;
  rawAnalyticsData?: any;  // Add this for LLM experimentation
}

const STYLE_CONFIGS = {
  mission_brief: {
    name: 'Mission Brief',
    description: 'Military precision, action-focused with clear directives',
    icon: Target,
    color: 'bg-red-500'
  },
  startup_velocity: {
    name: 'Startup Velocity',
    description: 'High-energy, opportunity-minded with rapid execution',
    icon: Zap,
    color: 'bg-orange-500'
  },
  management_consulting: {
    name: 'Management Consulting',
    description: 'Strategic framework with ROI analysis and phased approaches',
    icon: Briefcase,
    color: 'bg-blue-500'
  },
  newsletter: {
    name: 'Newsletter',
    description: 'Headlines, analysis, and expert insights format',
    icon: Newspaper,
    color: 'bg-green-500'
  }
};

const SCENARIO_CONFIGS = {
  normal: {
    name: 'Normal Operations',
    description: 'Standard business operations',
    color: 'bg-green-100 text-green-800'
  },
  crisis: {
    name: 'Crisis Mode',
    description: 'Active incidents and urgent issues',
    color: 'bg-red-100 text-red-800'
  },
  high_activity: {
    name: 'High Activity',
    description: 'Multiple opportunities and meetings',
    color: 'bg-orange-100 text-orange-800'
  }
};

export function EnhancedBriefDashboard() {
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectUrl, setReconnectUrl] = useState<string | null>(null);
  const [useRealData, setUseRealData] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('mission_brief');
  const [selectedScenario, setSelectedScenario] = useState('normal');
  const [showJsonOutput, setShowJsonOutput] = useState(false);

  const fetchBrief = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        use_real_data: useRealData.toString(),
        style: selectedStyle, // Use the selected style from state
        scenario: selectedScenario
      });
      
      console.log('🎯 Requesting brief with style:', selectedStyle);

      const response = await fetch(`/api/briefs/enhanced?${params}`);

      // Handle auth and permission errors explicitly
      if (!response.ok) {
        let payload: any = null;
        try { payload = await response.json(); } catch {}

        // 401 -> not signed in; send to login
        if (response.status === 401) {
          setError('You need to sign in to load your real data. Redirecting to login...');
          setTimeout(() => { window.location.href = '/login'; }, 800);
          return;
        }

        // 403 -> insufficient Gmail scope, show reconnect CTA if provided
        if (response.status === 403 && payload?.reconnect) {
          setError('Your Gmail permissions are insufficient for briefs. Please reconnect your account.');
          setReconnectUrl(payload.reconnect);
          return;
        }

        throw new Error(payload?.message || payload?.error || 'Failed to generate brief');
      }

      const data = await response.json();

      console.log('🎯 Received brief data:', data);
      console.log('🎯 Data style:', data.style);
      console.log('🎯 Has missionBrief?', !!data.missionBrief);
      console.log('🎯 Has startupVelocity?', !!data.startupVelocity);

      setBriefData(data);
      setReconnectUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setBriefData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we have a generated brief from dashboard
    const storedBrief = sessionStorage.getItem('currentBrief');
    if (storedBrief) {
      try {
        const parsedBrief = JSON.parse(storedBrief);
        setBriefData(parsedBrief);
        setSelectedStyle(parsedBrief.style || 'mission_brief');
        setUseRealData(parsedBrief.dataSource === 'real');
        // Clear the stored brief after using it
        sessionStorage.removeItem('currentBrief');
        return;
      } catch (error) {
        console.error('Error parsing stored brief:', error);
      }
    }
    
    fetchBrief();
  }, [useRealData, selectedStyle, selectedScenario]);

  const renderBriefContent = () => {
    if (!briefData) return null;

    const { style } = briefData;

    switch (style) {
      case 'mission_brief':
        return <MissionBriefView data={briefData.missionBrief} briefData={briefData} />;
      case 'startup_velocity':
        return <StartupVelocityView data={briefData.startupVelocity} />;
      case 'management_consulting':
        return <ConsultingView data={briefData.consulting} />;
      case 'newsletter':
        return <NewsletterView data={briefData.newsletter} />;
      default:
        return <DefaultBriefView data={briefData} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Enhanced Executive Briefs
            </h1>
            <p className="text-blue-100 mt-1">
              AI-powered situational awareness with multiple communication styles
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Data Source Toggle */}
            <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
              <Label htmlFor="data-source-toggle" className="text-sm text-white/70">
                Demo Data
              </Label>
              <Switch
                id="data-source-toggle"
                checked={useRealData}
                onCheckedChange={setUseRealData}
                className="data-[state=checked]:bg-green-500"
              />
              <Label htmlFor="data-source-toggle" className="text-sm text-white">
                My Gmail Data {useRealData && '🔗'}
              </Label>
            </div>

            {/* Style Selector */}
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STYLE_CONFIGS).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className="w-4 h-4" />
                      {config.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Scenario Selector (only for demo data) */}
            {!useRealData && (
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCENARIO_CONFIGS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button 
              onClick={fetchBrief} 
              disabled={loading}
              className="bg-white/20 hover:bg-white/30"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Status and Metadata */}
      {briefData && (
        <div className="flex flex-wrap gap-4 items-center">
          <Badge variant="outline" className="flex items-center gap-1">
            {briefData.dataSource === 'real' ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                Real Data
              </>
            ) : (
              <>
                <Info className="w-3 h-3 text-blue-500" />
                {briefData.dataSource === 'mock' ? 'Demo Data' : 'Custom Data'}
              </>
            )}
          </Badge>
          
          {briefData.scenario && (
            <Badge className={SCENARIO_CONFIGS[briefData.scenario as keyof typeof SCENARIO_CONFIGS]?.color}>
              {SCENARIO_CONFIGS[briefData.scenario as keyof typeof SCENARIO_CONFIGS]?.name}
            </Badge>
          )}
          
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Generated {new Date(briefData.generatedAt).toLocaleTimeString()}
          </Badge>

          {briefData.warning && (
            <Alert className="flex-1">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-sm">
                {briefData.warning}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Reconnect CTA when Gmail scope insufficient */}
      {reconnectUrl && (
        <div className="flex justify-end">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <a href={reconnectUrl}>Reconnect Gmail</a>
          </Button>
        </div>
      )}

      {/* Brief Content */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Generating your brief...</p>
          </CardContent>
        </Card>
      ) : (
        renderBriefContent()
      )}

      {/* JSON Output Section for LLM Experimentation */}
      {briefData && (
        <Collapsible open={showJsonOutput} onOpenChange={setShowJsonOutput}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                JSON Output for LLM Experimentation
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showJsonOutput ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Raw Analytics Data</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Copy this JSON data to experiment with different LLMs and prompting strategies
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={JSON.stringify(briefData, null, 2)}
                  readOnly
                  className="min-h-[400px] font-mono text-xs"
                  placeholder="JSON data will appear here..."
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(briefData, null, 2));
                      // Could add a toast notification here
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(briefData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `360brief-data-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// Individual brief style components
function MissionBriefView({ data, briefData }: { data: any; briefData: BriefData }) {
  if (!data) return null;

  // Use the new styled component that matches mock preview
  return (
    <StyledMissionBrief 
      data={data}
      generatedAt={briefData.generatedAt}
      dataSource={briefData.dataSource === 'real' ? 'real' : 'mock'}
    />
  );
}

function StartupVelocityView({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-orange-50">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Zap className="w-5 h-5" />
            Startup Velocity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {data.velocityCheck && (
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 p-4 rounded-lg">
                <p className="font-medium text-orange-900">{data.velocityCheck}</p>
              </div>
            )}

            {data.nextSixHours && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Next 6 Hours</h3>
                <div className="space-y-2">
                  {data.nextSixHours.map((action: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{action.timeLabel}</p>
                        <p className="text-sm text-muted-foreground">{action.goal}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.closingPrompt && (
              <div className="bg-orange-500 text-white p-4 rounded-lg">
                <p className="font-medium">{data.closingPrompt}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConsultingView({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Briefcase className="w-5 h-5" />
            Management Consulting Brief
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {data.executiveSummary && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Executive Summary</h3>
                <p className="text-muted-foreground">{data.executiveSummary}</p>
              </div>
            )}

            {data.strategyFramework && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Strategic Framework</h3>
                <div className="space-y-3">
                  {data.strategyFramework.map((phase: any, index: number) => (
                    <div key={index} className="border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">{phase.phase}</h4>
                      <p className="text-sm text-muted-foreground">{phase.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.recommendedActions && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Recommended Actions</h3>
                <ul className="space-y-2">
                  {data.recommendedActions.map((action: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NewsletterView({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Newspaper className="w-5 h-5" />
            Executive Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {data.headlines && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Headlines</h3>
                <div className="space-y-2">
                  {data.headlines.map((headline: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-2 border-l-2 border-green-500">
                      <span className="text-green-600 text-sm font-medium">•</span>
                      <span className="text-sm">{headline}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.featureTitle && (
              <div>
                <h3 className="font-semibold text-lg mb-2">{data.featureTitle}</h3>
                {data.featureParagraphs && (
                  <div className="space-y-2">
                    {data.featureParagraphs.map((paragraph: string, index: number) => (
                      <p key={index} className="text-muted-foreground">{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {data.analysis && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Analysis</h3>
                <ul className="space-y-2">
                  {data.analysis.map((insight: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.kudos && data.kudos.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Team Kudos</h3>
                <div className="space-y-2">
                  {data.kudos.map((kudo: any, index: number) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{kudo.name}</span>
                      <span className="text-muted-foreground"> ({kudo.role}): </span>
                      <span>{kudo.kudosSuggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DefaultBriefView({ data }: { data: BriefData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Executive Brief</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Subject</h3>
            <p>{data.subject}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">Summary</h3>
            <p className="text-muted-foreground">{data.tldr}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
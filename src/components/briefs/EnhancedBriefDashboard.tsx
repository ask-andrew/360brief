'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  ChevronDown,
  DollarSign,
  Trophy,
  Star
} from 'lucide-react';
import { StyledMissionBrief } from './StyledMissionBrief';
import { AudioPlayer } from './AudioPlayer';

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
  rawAnalyticsData?: any;
  digest_items?: any[];
  processing_metadata?: any;
  executive_summary?: any;
  action_dashboard?: any;
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
  const [useLLM, setUseLLM] = useState(false);
  const [topicThresh, setTopicThresh] = useState(0.22);
  const [topicTopN, setTopicTopN] = useState(20);
  const [topicBigrams, setTopicBigrams] = useState(true);
  const [tuningPreset, setTuningPreset] = useState<'low' | 'medium' | 'high'>('medium');
  const [showTuning, setShowTuning] = useState(false);

  const applyPreset = useCallback((preset: 'low' | 'medium' | 'high') => {
    setTuningPreset(preset);
    if (preset === 'low') {
      setTopicThresh(0.26);
      setTopicTopN(15);
      setTopicBigrams(true);
    } else if (preset === 'medium') {
      setTopicThresh(0.22);
      setTopicTopN(20);
      setTopicBigrams(true);
    } else {
      // high (aggressive merging)
      setTopicThresh(0.20);
      setTopicTopN(25);
      setTopicBigrams(true);
    }
  }, []);

  const fetchBrief = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        use_real_data: useRealData.toString(),
        style: selectedStyle, // Use the selected style from state
        scenario: selectedScenario,
        use_llm: useLLM.toString(),
        topic_thresh: topicThresh.toString(),
        topic_topn: topicTopN.toString(),
        topic_bigrams: topicBigrams.toString()
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

      setBriefData({ ...data, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' });
      setReconnectUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setBriefData(null);
    } finally {
      setLoading(false);
    }
  }, [useRealData, selectedStyle, selectedScenario, useLLM, topicThresh, topicTopN, topicBigrams]);

  useEffect(() => {
    const storedBrief = sessionStorage.getItem('currentBrief');
    if (storedBrief) {
      try {
        const parsedBrief = JSON.parse(storedBrief);
        setBriefData(parsedBrief);
        setSelectedStyle(parsedBrief.style || 'mission_brief');
        setUseRealData(parsedBrief.dataSource === 'real');
        sessionStorage.removeItem('currentBrief');
      } catch (error) {
        console.error('Error parsing stored brief:', error);
      }
    } else {
      fetchBrief();
    }
  }, [fetchBrief]);

  const renderBriefContent = () => {
    if (!briefData) return null;

    const { style } = briefData;

    // Check if this is the new clustered format with digest_items
    if (briefData.digest_items && Array.isArray(briefData.digest_items)) {
      return <ClusteredBriefView data={briefData} />;
    }

    // Legacy format handling
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
          
          <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
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

            {/* Tuning Toggle Button */}
            <Button
              type="button"
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => setShowTuning((v) => !v)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Tuning
            </Button>

            {/* Clustering Parameter Controls Panel */}
            {showTuning && (
            <div className="bg-white/10 rounded-lg p-3 space-y-2 w-full lg:w-auto">
              <div className="text-xs text-white/90 mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span>Clustering Tuning</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-white/90 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[300px] text-xs bg-white text-gray-800 border border-gray-200 shadow-md">
                        <div className="space-y-1">
                          <p><strong>Preset</strong>: Pick Low (conservative), Medium (balanced), High (aggressive merge).</p>
                          <p><strong>Thresh</strong>: Lower merges more threads (try 0.20–0.24). Raise to split unrelated topics.</p>
                          <p><strong>Top N</strong>: More features (20–25) increases chance of overlap.</p>
                          <p><strong>Bigrams</strong>: Two-word phrases (e.g., "tee times", "set list"). Keep on.</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {/* AI Toggle restored */}
                <div className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded">
                  <Label htmlFor="llm-toggle" className="text-xs text-white/80">Basic</Label>
                  <Switch id="llm-toggle" checked={useLLM} onCheckedChange={setUseLLM} className="data-[state=checked]:bg-purple-500 scale-75" />
                  <Label htmlFor="llm-toggle" className="text-xs text-white">AI</Label>
                </div>
              </div>

              {/* Preset Selector */}
              <div className="flex items-center gap-2">
                <Label className="text-xs text-white/80 w-16">Preset</Label>
                <Select value={tuningPreset} onValueChange={(v) => applyPreset(v as any)}>
                  <SelectTrigger className="w-32 h-8 bg-white/20 border-white/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Conservative)</SelectItem>
                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                    <SelectItem value="high">High (Aggressive)</SelectItem>
                  </SelectContent>
                </Select>
                {/* Advanced controls (optional tweaks) */}
                <div className="flex items-center gap-2 ml-2">
                  <Label htmlFor="topic-thresh" className="text-xs text-white/80">Thresh</Label>
                  <Input id="topic-thresh" type="number" step="0.01" min="0.1" max="0.8" value={topicThresh}
                    onChange={(e) => setTopicThresh(Number(e.target.value))}
                    className="w-20 h-7 text-xs bg-white/20 border-white/30 text-white placeholder:text-white/50" />
                  <Label htmlFor="topic-topn" className="text-xs text-white/80">Top N</Label>
                  <Input id="topic-topn" type="number" step="1" min="10" max="30" value={topicTopN}
                    onChange={(e) => setTopicTopN(Number(e.target.value))}
                    className="w-16 h-7 text-xs bg-white/20 border-white/30 text-white placeholder:text-white/50" />
                  <Label htmlFor="topic-bigrams" className="text-xs text-white/80">Bigrams</Label>
                  <Switch id="topic-bigrams" checked={topicBigrams} onCheckedChange={setTopicBigrams} className="data-[state=checked]:bg-green-500 scale-75" />
                </div>
              </div>
            </div>
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

          {/* Clustering Parameters Display */}
          {briefData.processing_metadata?.debug && (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                Thresh: {briefData.processing_metadata.debug.topic_thresh}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Top N: {briefData.processing_metadata.debug.topic_topn}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Bigrams: {briefData.processing_metadata.debug.topic_bigrams ? 'On' : 'Off'}
              </Badge>
            </div>
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
                <h3 className="font-semibold text-lg mb-2">Strategic Framework</h3>
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

function ClusteredBriefView({ data }: { data: BriefData }) {
  if (!data.digest_items || !Array.isArray(data.digest_items)) return null;

  const allClusters = data.digest_items;
  const achievementClusters = allClusters.filter((cluster: any) => cluster.signal_type === 'achievement');
  const otherClusters = allClusters.filter((cluster: any) => cluster.signal_type !== 'achievement');

  const individualItems = allClusters.reduce((acc: number, cluster: any) => acc + (cluster.items?.length || 0), 0);

  const processingMeta = data.processing_metadata || {};
  const emailsProcessed = processingMeta.total_emails_processed || allClusters.length;
  const intelligence = processingMeta.intelligence_engine || 'ExecutiveIntelligenceEngine_v3';

  return (
    <div className="space-y-6">
      {/* Executive Overview */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Target className="w-5 h-5" />
            Executive Intelligence Brief
            <Badge variant="secondary" className="ml-2">
              {emailsProcessed} emails • {allClusters.length} topics
            </Badge>
          </CardTitle>
          <p className="text-blue-600 text-sm">
            Processed with {intelligence}
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {data.executive_summary?.key_insights && Array.isArray(data.executive_summary.key_insights) && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
              <h3 className="font-semibold text-blue-900 mb-2">Executive Summary</h3>
              <div className="space-y-3">
                {data.executive_summary.key_insights.map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategic Recommendations (dynamic) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Recommended Actions
              </h4>
              {(() => {
                // Collect top actions from clusters (sorted by urgency if available)
                const clustersSorted = [...allClusters].sort((a: any, b: any) => (b.metrics?.urgency_score || 0) - (a.metrics?.urgency_score || 0));
                const actions = clustersSorted.flatMap((c: any) => Array.isArray(c.actions) ? c.actions.slice(0, 2) : []).filter(Boolean);
                // Fallbacks if no actions returned by API
                const fallbacks = clustersSorted.slice(0, 3).map((c: any) => {
                  if ((c.metrics?.blockers || 0) > 0) return `Unblock: '${c.title}' — ping owner to resolve blockers`;
                  if ((c.metrics?.decisions || 0) > 0) return `Decide: '${c.title}' — provide approval/decision`;
                  return `Follow up: '${c.title}' — confirm next steps`;
                });
                const deduped = Array.from(new Set([...(actions as string[]), ...fallbacks])).slice(0, 6);
                return (
                  <ul className="space-y-1 text-sm text-blue-800">
                    {deduped.map((a: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                    {deduped.length === 0 && (
                      <li className="text-sm text-blue-900/80">No immediate actions detected. Adjust tuning or timeframe.</li>
                    )}
                  </ul>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{allClusters.length}</div>
              <div className="text-sm text-muted-foreground">Topic Clusters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{individualItems}</div>
              <div className="text-sm text-muted-foreground">Individual Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{emailsProcessed}</div>
              <div className="text-sm text-muted-foreground">Total Analyzed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winbox - Team Achievements */}
      {achievementClusters.length > 0 && (
        <Card>
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Trophy className="w-5 h-5" />
              WINBOX - Team Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {achievementClusters.map((achCluster: any) => (
                achCluster.items && Array.isArray(achCluster.items) && achCluster.items.map((item: any, itemIndex: number) => (
                  <div key={itemIndex} className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-green-100 p-2 rounded-full">
                            <Star className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 text-lg">{item.content}</span>
                            {item.impact_level && (
                              <Badge className={`ml-2 text-xs ${item.impact_level === 'high' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-blue-100 text-blue-800 border-blue-300'}`}>
                                {item.impact_level === 'high' ? '🚀 High Impact' : '✨ Notable'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {item.stakeholders && Array.isArray(item.stakeholders) && item.stakeholders.length > 0 && (
                          <p className="text-sm text-gray-600 mb-2">🎯 <strong>Contributors:</strong> {item.stakeholders.join(', ')}</p>
                        )}
                        {item.financial_impact && (
                          <p className="text-sm text-green-700 font-medium mb-2">💰 <strong>Value:</strong> ${item.financial_impact.toLocaleString()}</p>
                        )}
                        <div className="bg-white/60 p-3 rounded-lg border border-green-200">
                          <p className="text-sm text-gray-700 italic">"This achievement demonstrates exceptional {item.impact_level === 'high' ? 'strategic impact' : 'execution'} and contributes significantly to our goals."</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ))}
            </div>
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800 font-medium">💡 Consider sending kudos to recognize these achievements</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Topic Areas (other clusters) */}
      {otherClusters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Key Topic Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {otherClusters.map((cluster: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Topic {index + 1}
                      </Badge>
                    </div>
                    <Badge variant="secondary">
                      {cluster.items?.length || 0} items
                    </Badge>
                  </div>

                  <h4 className="font-semibold text-lg mb-2 text-gray-900">
                    {cluster.title || `Topic ${index + 1}`}
                  </h4>

                  {(() => {
                    const blk = cluster.metrics?.blockers || 0;
                    const dec = cluster.metrics?.decisions || 0;
                    const ach = cluster.metrics?.achievements || 0;
                    const dates = (cluster.items || []).map((it: any) => it.date).filter(Boolean).map((d: string) => new Date(d).getTime());
                    const minD = dates.length ? new Date(Math.min(...dates)).toLocaleDateString() : null;
                    const maxD = dates.length ? new Date(Math.max(...dates)).toLocaleDateString() : null;
                    const theme = cluster.title || `Topic ${index + 1}`;
                    const sentiment = ach > 0 && blk === 0 && dec === 0 ? 'running smoothly' : blk > 0 ? 'needs attention' : dec > 0 ? 'awaiting decisions' : 'active';
                    const range = minD && maxD ? (minD === maxD ? minD : `${minD} – ${maxD}`) : undefined;
                    const pieces: string[] = [];
                    if (ach > 0) pieces.push(`${ach} achievement${ach>1?'s':''}`);
                    if (dec > 0) pieces.push(`${dec} decision${dec>1?'s':''} pending`);
                    if (blk > 0) pieces.push(`${blk} blocker${blk>1?'s':''}`);
                    const statusText = pieces.length ? pieces.join(', ') : 'no blockers or decisions pending';
                    const synthesized = `${theme}: ${sentiment}${statusText ? ` — ${statusText}` : ''}${range ? ` (${range})` : ''}.`;
                    const line = (cluster.summary && String(cluster.summary).trim().length>0) ? cluster.summary : synthesized;
                    return (
                      <div className="mb-3 bg-white p-3 rounded border border-gray-200">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Summary</div>
                        <p className="text-gray-700 mb-2 text-sm">{line}</p>
                        <div className="flex gap-3 text-xs text-gray-600">
                          <span>Decisions: {dec}</span>
                          <span>Blockers: {blk}</span>
                          <span>Achievements: {ach}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {cluster.items && Array.isArray(cluster.items) && cluster.items.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <div className="text-sm font-medium text-gray-600 mb-2">Related Items:</div>
                      <div className="space-y-2">
                        {cluster.items.slice(0, 3).map((item: any, itemIndex: number) => (
                          <div key={itemIndex} className="text-sm bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                            <div className="flex items-start gap-2 mb-2">
                              <div className="bg-blue-100 p-1 rounded-full flex-shrink-0 mt-0.5">
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 mb-1">{item.subject || item.content}</div>
                                <div className="text-gray-700 text-xs leading-relaxed">{item.snippet || item.content}</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                              {item.stakeholders && Array.isArray(item.stakeholders) && item.stakeholders.length > 0 && (
                                <span>👥 {item.stakeholders.join(', ')}</span>
                              )}
                              {item.date && (
                                <span>📅 {new Date(item.date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))} 
                        {cluster.items.length > 3 && (
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-dashed border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors">
                            <div className="flex items-center gap-1 justify-center">
                              <ChevronDown className="w-3 h-3" />
                              <span>+{cluster.items.length - 3} more items in this topic</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual High-Priority Items - This section is not applicable to the new data structure */}

      {/* Processing Metadata */}
      {processingMeta && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4" />
              Processing Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {emailsProcessed && (
                <div>
                  <div className="font-medium text-gray-600">Communications Analyzed</div>
                  <div className="text-lg">{emailsProcessed}</div>
                  <div className="text-xs text-muted-foreground">Total emails processed</div>
                </div>
              )}
              {individualItems && (
                <div>
                  <div className="font-medium text-gray-600">Relevant Signals</div>
                  <div className="text-lg">{individualItems}</div>
                  <div className="text-xs text-muted-foreground">Extracted insights & actions</div>
                </div>
              )}
              {intelligence && (
                <div>
                  <div className="font-medium text-gray-600">Engine</div>
                  <div className="text-sm">{intelligence}</div>
                </div>
              )}
              {data.action_dashboard?.estimated_review_time_minutes && (
                <div>
                  <div className="font-medium text-gray-600">Est. Review Time</div>
                  <div className="text-lg">{Math.round(data.action_dashboard.estimated_review_time_minutes / 60)} min</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
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
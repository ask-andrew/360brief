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
import { useAuth } from '@/contexts/AuthContext';
import { NarrativeFeedbackDashboard } from './NarrativeFeedbackDashboard';
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
  // Narrative brief state
  const [narrativeMarkdown, setNarrativeMarkdown] = useState<string>('');
  const [narrativeLoading, setNarrativeLoading] = useState<boolean>(false);
  const [narrativeError, setNarrativeError] = useState<string | null>(null);
  const [narrativeFeedback, setNarrativeFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<boolean>(false);
  const [showFeedbackComments, setShowFeedbackComments] = useState<boolean>(false);
  const [feedbackComments, setFeedbackComments] = useState<string>('');
  const [currentBriefMetadata, setCurrentBriefMetadata] = useState<any>(null);

  const { user } = useAuth();

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

  // Submit narrative feedback
  const submitNarrativeFeedback = useCallback(async (feedbackType: 'helpful' | 'not_helpful') => {
    if (!currentBriefMetadata || !narrativeMarkdown) return;

    setFeedbackSubmitting(true);
    try {
      const response = await fetch('/api/narrative-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine_used: currentBriefMetadata.engine_used,
          generation_timestamp: currentBriefMetadata.generation_timestamp,
          input_emails_count: currentBriefMetadata.input_emails_count,
          input_clusters_count: currentBriefMetadata.input_clusters_count,
          cluster_data: currentBriefMetadata.cluster_data,
          llm_prompt: currentBriefMetadata.llm_prompt,
          llm_model: currentBriefMetadata.llm_model,
          llm_response_time_ms: currentBriefMetadata.response_time_ms,
          generated_markdown: narrativeMarkdown,
          executive_summary: currentBriefMetadata.executive_summary,
          feedback_type: feedbackType,
          feedback_comments: feedbackComments.trim() || undefined
        })
      });

      if (response.ok) {
        setNarrativeFeedback(feedbackType);
        setShowFeedbackComments(false);
        setFeedbackComments('');
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting narrative feedback:', error);
      // Could add toast notification here
    } finally {
      setFeedbackSubmitting(false);
    }
  }, [currentBriefMetadata, narrativeMarkdown, feedbackComments]);

  // Generate narrative brief via proxy route using real emails when available
  const generateNarrativeBrief = useCallback(async () => {
    if (!briefData) return;
    // Prefer raw emails if present
    let emails: any[] = Array.isArray(briefData.rawAnalyticsData?.emails)
      ? briefData.rawAnalyticsData.emails
      : [];
    // Fallback: synthesize email-like objects from digest_items
    if ((!emails || emails.length === 0) && Array.isArray(briefData.digest_items)) {
      const synthesized: any[] = [];
      for (const cluster of briefData.digest_items) {
        if (Array.isArray(cluster.items)) {
          for (const it of cluster.items) {
            const subject = it.subject || it.title || 'No Subject';
            const body = it.content || it.snippet || '';
            const sender = it.from || it.sender || it.author || undefined;
            const date = it.date || it.timestamp || undefined;
            synthesized.push({ id: it.id || subject, subject, body, from: sender, date });
          }
        }
      }
      emails = synthesized;
    }
    if (!Array.isArray(emails) || emails.length === 0) {
      setNarrativeError('No source emails available in this brief to generate a narrative.');
      setNarrativeMarkdown('');
      return;
    }

    setNarrativeLoading(true);
    setNarrativeError(null);
    try {
      const res = await fetch('/api/briefs/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails,
          max_projects: 8,
          include_clusters: true,
          use_real_data: useRealData,
          user_id: user?.id || 'andrew.ledet@gmail.com'
        })
      });
      if (!res.ok) {
        const text = await res.text();
        setNarrativeError(`Upstream error: ${text || res.statusText}`);
        setNarrativeMarkdown('');
        return;
      }
      const data = await res.json();
      setNarrativeMarkdown(data.markdown || '');
      setCurrentBriefMetadata(data.feedback_metadata || null);
      setNarrativeFeedback(null); // Reset feedback state for new brief
      setShowFeedbackComments(false);
      setFeedbackComments('');
    } catch (e: any) {
      setNarrativeError(e?.message ? `Network error: ${e.message}` : 'Network error generating narrative.');
      setNarrativeMarkdown('');
    } finally {
      setNarrativeLoading(false);
    }
  }, [briefData, useRealData, user]);

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

      {/* Narrative Brief Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Narrative Brief Preview (Project-clustered)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={generateNarrativeBrief}
              disabled={
                narrativeLoading || !(
                  (briefData?.rawAnalyticsData?.emails?.length ?? 0) > 0 ||
                  (briefData?.digest_items?.length ?? 0) > 0
                )
              }
            >
              {narrativeLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Generating...
                </>
              ) : (
                'Generate Narrative Brief'
              )}
            </Button>
            {!(
              (briefData?.rawAnalyticsData?.emails?.length ?? 0) > 0 ||
              (briefData?.digest_items?.length ?? 0) > 0
            ) && (
              <span className="text-xs text-muted-foreground">No source items detected for narrative generation. Load real data and refresh the brief.</span>
            )}
          </div>

          {narrativeError && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{narrativeError}</AlertDescription>
            </Alert>
          )}

          {narrativeMarkdown && (
            <div className="space-y-4">
              {/* Feedback buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Was this summary helpful?</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant={narrativeFeedback === 'helpful' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => submitNarrativeFeedback('helpful')}
                      disabled={feedbackSubmitting || narrativeFeedback !== null}
                      className="flex items-center gap-1"
                    >
                      <span className="text-lg">👍</span>
                      Helpful
                    </Button>
                    <Button
                      variant={narrativeFeedback === 'not_helpful' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setNarrativeFeedback('not_helpful');
                        setShowFeedbackComments(true);
                      }}
                      disabled={feedbackSubmitting || narrativeFeedback === 'helpful'}
                      className="flex items-center gap-1"
                    >
                      <span className="text-lg">👎</span>
                      Not Helpful
                    </Button>
                  </div>
                </div>

                {/* Engine info */}
                {currentBriefMetadata && (
                  <Badge variant="outline" className="text-xs">
                    {currentBriefMetadata.llm_model ? 'LLM Enhanced' : 'Rule-Based'}
                  </Badge>
                )}
              </div>

              {/* Feedback comments (shown when "Not Helpful" is clicked) */}
              {showFeedbackComments && narrativeFeedback === 'not_helpful' && (
                <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <Label className="text-sm font-medium text-red-800">
                    What could be improved? (Optional)
                  </Label>
                  <Textarea
                    placeholder="e.g., Missing key information, unclear actions, wrong priorities..."
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => submitNarrativeFeedback('not_helpful')}
                      disabled={feedbackSubmitting}
                    >
                      {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowFeedbackComments(false);
                        setNarrativeFeedback(null);
                        setFeedbackComments('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Thank you message */}
              {narrativeFeedback && !showFeedbackComments && (
                <div className={`p-3 rounded-lg text-sm ${
                  narrativeFeedback === 'helpful'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  {narrativeFeedback === 'helpful'
                    ? 'Thank you! This feedback helps us improve the narrative quality.'
                    : 'Thank you for your feedback! We\'ll use this to improve our synthesis prompts and rules.'
                  }
                </div>
              )}

              {/* Narrative brief content */}
              <div className="border rounded-md p-3 bg-muted/20 overflow-x-auto whitespace-pre-wrap">
                <pre className="text-sm leading-6">{narrativeMarkdown}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Narrative Feedback Analytics */}
      <NarrativeFeedbackDashboard />

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

  const processingMeta = data.processing_metadata || {};

  // Master de-duplication and aggregation logic
  const masterItems = new Map<string, {
    id: string;
    title: string;
    content: string;
    statuses: Set<string>;
    financial_impact: number;
    stakeholders: Set<string>;
    clusters: Set<string>;
    items: any[];
    highest_severity: string;
  }>();

  // Process all items from all clusters
  for (const cluster of allClusters) {
    if (cluster.items && Array.isArray(cluster.items)) {
      for (const item of cluster.items) {
        const itemKey = item.subject || item.content || item.id;
        if (!itemKey) continue;

        if (masterItems.has(itemKey)) {
          // Update existing master item
          const master = masterItems.get(itemKey)!;
          master.financial_impact += item.financial_impact || 0;
          (item.stakeholders || []).forEach((stakeholder: string) => master.stakeholders.add(stakeholder));
          master.clusters.add(cluster.title || 'Unnamed Cluster');
          master.items.push(item);

          // Update statuses based on cluster type and item properties
          if (cluster.signal_type === 'achievement') master.statuses.add('Achievement');
          if (cluster.signal_type === 'blocker') master.statuses.add('Blocker');
          if (cluster.signal_type === 'decision') master.statuses.add('Decision');
        } else {
          // Create new master item
          const statuses = new Set<string>();
          if (cluster.signal_type === 'achievement') statuses.add('Achievement');
          if (cluster.signal_type === 'blocker') statuses.add('Blocker');
          if (cluster.signal_type === 'decision') statuses.add('Decision');

          masterItems.set(itemKey, {
            id: item.id || itemKey,
            title: itemKey,
            content: item.content || item.snippet || '',
            statuses,
            financial_impact: item.financial_impact || 0,
            stakeholders: new Set(item.stakeholders || []),
            clusters: new Set([cluster.title || 'Unnamed Cluster']),
            items: [item],
            highest_severity: 'Medium'
          });
        }
      }
    }
  }

  // Calculate highest severity for each master item
  for (const master of masterItems.values()) {
    if (master.statuses.has('Blocker')) {
      master.highest_severity = 'Urgent';
    } else if (master.statuses.has('Decision')) {
      master.highest_severity = 'High';
    } else if (master.statuses.has('Achievement')) {
      master.highest_severity = 'Medium';
    }
  }

  // Convert to array for easier processing
  const uniqueItems = Array.from(masterItems.values());

  // Get actionable items (decisions and blockers)
  const actionableItems = uniqueItems.filter(item =>
    item.statuses.has('Decision') || item.statuses.has('Blocker')
  );

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

          {/* Executive Synthesis - Bold Summary Statement */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mb-6">
            <h3 className="font-bold text-xl text-blue-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Executive Intelligence Brief
            </h3>

            {(() => {
              // Calculate key metrics for synthesis using master items
              const totalItems = uniqueItems.length;
              const urgentItems = uniqueItems.filter(item => item.highest_severity === 'Urgent').length;
              const highPriorityItems = uniqueItems.filter(item => item.highest_severity === 'High').length;
              const achievements = uniqueItems.filter(item => item.statuses.has('Achievement')).length;
              const totalFinancial = uniqueItems.reduce((acc, item) => acc + item.financial_impact, 0);

              // Build synthesis statement
              const parts = [];
              if (urgentItems > 0) parts.push(`${urgentItems} urgent blocker${urgentItems > 1 ? 's' : ''}`);
              if (highPriorityItems > 0) parts.push(`${highPriorityItems} decision${highPriorityItems > 1 ? 's' : ''} pending`);
              if (achievements > 0) parts.push(`${achievements} achievement${achievements > 1 ? 's' : ''}`);

              const synthesis = parts.length > 0
                ? `${parts.join(' and ')} ${totalFinancial > 0 ? `totaling $${(totalFinancial / 1000000).toFixed(1)}M` : ''} are your top priorities today.`
                : `Review ${totalItems} communications for opportunities and risks.`;

              return (
                <div className="bg-white/70 p-4 rounded-lg border border-blue-100">
                  <p className="text-lg font-semibold text-blue-800 mb-2">
                    {synthesis}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{urgentItems}</div>
                      <div className="text-gray-600">Urgent Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{highPriorityItems}</div>
                      <div className="text-gray-600">High Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{achievements}</div>
                      <div className="text-gray-600">Achievements</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
                      <div className="text-gray-600">Total Items</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Decision & Action Required Section - Individual Items First */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200 mb-6">
            <h3 className="font-bold text-xl text-orange-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Immediate Actions Required
            </h3>

            {(() => {
              // Show individual actionable items with their aggregated data
              const displayedItems = actionableItems.slice(0, 8);

              return (
                <div className="space-y-3">
                  {displayedItems.map((item, i) => {
                    const statusText = Array.from(item.statuses).join('/');
                    const stakeholdersArray = Array.from(item.stakeholders);
                    const financialText = item.financial_impact > 0 ? `$${item.financial_impact.toLocaleString()}` : '';

                    return (
                      <div key={i} className={`p-3 rounded-lg border ${item.highest_severity === 'Urgent' ? 'bg-red-100 border-red-300' : 'bg-orange-100 border-orange-300'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">{item.title}</div>
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">Status:</span> {statusText} {financialText && `| ${financialText}`}
                            </div>
                          </div>
                        </div>
                        {stakeholdersArray.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Contributors:</span> {stakeholdersArray.join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {actionableItems.length === 0 && (
                    <div className="text-gray-500 italic">No immediate actions identified.</div>
                  )}
                  {actionableItems.length > 8 && (
                    <div className="text-sm text-gray-600 bg-orange-100 p-2 rounded border border-orange-200">
                      +{actionableItems.length - 8} additional actions requiring attention
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Financial Health Snapshot */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200 mb-6">
            <h3 className="font-bold text-xl text-green-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Health Snapshot
            </h3>

            {(() => {
              const achievements = uniqueItems.filter(item => item.statuses.has('Achievement'));
              const highImpact = achievements.filter(item => item.highest_severity === 'High').length;
              const totalValue = achievements.reduce((acc, item) => acc + item.financial_impact, 0);

              const decisionItems = uniqueItems.filter(item => item.statuses.has('Decision'));
              const decisionValue = decisionItems.reduce((acc, item) => acc + item.financial_impact, 0);

              const blockerItems = uniqueItems.filter(item => item.statuses.has('Blocker'));
              const riskValue = blockerItems.reduce((acc, item) => acc + item.financial_impact, 0);

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/70 p-4 rounded-lg border border-green-200">
                    <div className="text-sm font-medium text-green-700 mb-1">Total Achievement Value</div>
                    <div className="text-2xl font-bold text-green-600">${(totalValue / 1000000).toFixed(1)}M</div>
                    <div className="text-xs text-gray-600">{achievements.length} achievements</div>
                  </div>

                  <div className="bg-white/70 p-4 rounded-lg border border-orange-200">
                    <div className="text-sm font-medium text-orange-700 mb-1">Decisions Pending Value</div>
                    <div className="text-2xl font-bold text-orange-600">${(decisionValue / 1000000).toFixed(1)}M</div>
                    <div className="text-xs text-gray-600">{decisionItems.length} decision items</div>
                  </div>

                  <div className="bg-white/70 p-4 rounded-lg border border-red-200">
                    <div className="text-sm font-medium text-red-700 mb-1">Items At Risk</div>
                    <div className="text-2xl font-bold text-red-600">${(riskValue / 1000000).toFixed(1)}M</div>
                    <div className="text-xs text-gray-600">{blockerItems.length} blocker items</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Winbox - Team Achievements (Optimized) */}
      {achievementClusters.length > 0 && (
        <Card>
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Trophy className="w-5 h-5" />
              WINBOX - Team Achievements & Momentum
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {(() => {
              // Show only top 2-3 high-impact achievements from master items
              const highImpactAchievements = uniqueItems
                .filter(item => item.statuses.has('Achievement') && item.highest_severity === 'High')
                .slice(0, 2);

              const remainingAchievements = uniqueItems
                .filter(item => item.statuses.has('Achievement') && item.highest_severity !== 'High')
                .length;

              return (
                <div className="space-y-4">
                  {/* Top High-Impact Achievements */}
                  {highImpactAchievements.map((item, itemIndex) => (
                    <div key={itemIndex} className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-green-100 p-2 rounded-full">
                              <Star className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 text-lg">{item.title}</span>
                              <Badge className="ml-2 text-xs bg-green-100 text-green-800 border-green-300">
                                🚀 High Impact
                              </Badge>
                            </div>
                          </div>
                          {Array.from(item.stakeholders).length > 0 && (
                            <p className="text-sm text-gray-600 mb-2">🎯 <strong>Contributors:</strong> {Array.from(item.stakeholders).join(', ')}</p>
                          )}
                          {item.financial_impact > 0 && (
                            <p className="text-sm text-green-700 font-medium mb-2">💰 <strong>Value:</strong> ${item.financial_impact.toLocaleString()}</p>
                          )}
                          <div className="bg-white/60 p-3 rounded-lg border border-green-200">
                            <p className="text-sm text-gray-700 italic">"This achievement demonstrates exceptional strategic impact and contributes significantly to our goals."</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Summary of remaining achievements */}
                  {remainingAchievements > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          {remainingAchievements} additional achievement{remainingAchievements > 1 ? 's' : ''} noted across learning and execution
                        </span>
                      </div>
                      <p className="text-sm text-green-700">💡 Consider sending kudos to recognize these contributions</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Key Topic Areas - Contextual Summaries & Coherent Clustering */}
      {otherClusters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Key Topic Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {otherClusters.map((cluster: any, index: number) => {
                // Group items by source/domain for recurring messages
                const itemsBySource = new Map<string, any[]>();
                cluster.items?.forEach((item: any) => {
                  const source = item.from?.email || item.from?.name || 'Unknown';
                  if (!itemsBySource.has(source)) {
                    itemsBySource.set(source, []);
                  }
                  itemsBySource.get(source)!.push(item);
                });

                // Generate contextual summary
                const generateContextualSummary = () => {
                  const iteratorResult = itemsBySource.values().next();
                  const firstValue = iteratorResult.value;
                  if (itemsBySource.size === 1 && firstValue && firstValue.length > 3) {
                    // Recurring newsletter pattern
                    const source = Array.from(itemsBySource.keys())[0];
                    const items = itemsBySource.get(source)!;
                    const titles = items.map(item => item.subject || item.content).slice(0, 3);

                    return `${source} - Recurring Newsletter (${items.length} items processed): Latest highlights include ${titles.join(', ')}. No business action required.`;
                  } else {
                    // Standard cluster summary
                    return cluster.summary || `${cluster.title || `Topic ${index + 1}`}: ${cluster.items?.length || 0} related items processed.`;
                  }
                };

                // Get non-actionable items (not already shown in Immediate Actions)
                const nonActionableItems = cluster.items?.filter((item: any) => {
                  const itemKey = item.subject || item.content || item.id;
                  return !actionableItems.some(actionable => actionable.title === itemKey);
                }).slice(0, 3) || [];

                return (
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

                    {/* Contextual Summary */}
                    <div className="mb-3 bg-white p-3 rounded border border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Contextual Summary</div>
                      <p className="text-gray-700 mb-2 text-sm">{generateContextualSummary()}</p>
                      <div className="flex gap-3 text-xs text-gray-600">
                        <span>Decisions: {cluster.metrics?.decisions || 0}</span>
                        <span>Blockers: {cluster.metrics?.blockers || 0}</span>
                        <span>Achievements: {cluster.metrics?.achievements || 0}</span>
                      </div>
                    </div>

                    {/* Show non-actionable items if any */}
                    {nonActionableItems.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <div className="text-sm font-medium text-gray-600 mb-2">Related Items:</div>
                        <div className="space-y-2">
                          {nonActionableItems.map((item: any, itemIndex: number) => (
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
                                {Array.from(masterItems.get(item.subject || item.content || item.id)?.stakeholders || []).length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {Array.from(masterItems.get(item.subject || item.content || item.id)?.stakeholders || []).join(', ')}
                                  </span>
                                )}
                                {item.date && (
                                  <span>📅 {new Date(item.date).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
              {uniqueItems && (
                <div>
                  <div className="font-medium text-gray-600">Relevant Signals</div>
                  <div className="text-lg">{uniqueItems.length}</div>
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
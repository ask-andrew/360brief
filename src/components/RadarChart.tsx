'use client';

import { useEffect, useRef, useState } from 'react';

interface RadarItem {
  id: string;
  summary: string;
  impactArea: string;
  urgencyScore: 'Low' | 'Medium' | 'High';
  severityScore: 'Minor' | 'Major' | 'Critical';
  suggestedAction: string;
  relatedEmails: string[];
}

interface RadarChartProps {
  data: RadarItem[];
}

interface TooltipData {
  item: RadarItem;
  x: number;
  y: number;
}

interface DetailPanelData {
  item: RadarItem;
  confidenceScore: number;
  aiContext: string;
  relevantCommunications: Array<{
    id: string;
    subject: string;
    sender: string;
    timestamp: string;
    snippet: string;
  }>;
}

// Impact area definitions with colors and labels
const IMPACT_AREAS = {
  'Project Delivery': { color: '#ff6b6b', label: 'Project Nexus', icon: '🚀' },
  'Business Growth': { color: '#4ecdc4', label: 'Strategic Initiatives', icon: '📈' },
  'Customer Success': { color: '#45b7d1', label: 'Client Relations', icon: '🤝' },
  'Team Dynamics': { color: '#f9ca24', label: 'Team Velocity', icon: '👥' },
  'Resource Management': { color: '#6c5ce7', label: 'Resource Flow', icon: '⚡' },
  'General': { color: '#a4b0be', label: 'External Factors', icon: '🌍' }
};

// Risk level definitions for positioning
const RISK_LEVELS = {
  radius: [80, 140, 200, 260], // Distance from center for each risk level
  colors: {
    'Low': { urgency: '#e8f5e8', severity: '#ffeaa7' },
    'Medium': { urgency: '#d4e157', severity: '#ffb74d' },
    'High': { urgency: '#ff7043', severity: '#f44336' },
    'Minor': { urgency: '#e8f5e8', severity: '#ffeaa7' },
    'Major': { urgency: '#d4e157', severity: '#ffb74d' },
    'Critical': { urgency: '#ff7043', severity: '#f44336' }
  }
};

export default function RadarChart({ data }: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedItem, setSelectedItem] = useState<DetailPanelData | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'risks' | 'opportunities'>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'severity' | 'latest'>('urgency');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement;
        if (container) {
          setDimensions({
            width: container.clientWidth,
            height: container.clientHeight || 600
          });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Generate AI confidence score and context
  const generateAIInsights = (item: RadarItem): DetailPanelData => {
    // Simulate AI confidence based on data quality
    const confidenceScore = Math.floor(Math.random() * 30) + 70; // 70-100%

    // Generate AI context based on item
    const aiContext = generateAIContext(item);

    // Generate relevant communications
    const relevantCommunications = generateRelevantCommunications(item);

    return {
      item,
      confidenceScore,
      aiContext,
      relevantCommunications
    };
  };

  const generateAIContext = (item: RadarItem): string => {
    const contexts = {
      'Project Delivery': `AI detected escalating concerns in ${Math.floor(Math.random() * 5) + 3} emails over ${Math.floor(Math.random() * 48) + 24} hours regarding project delays impacting timelines. Key phrases: 'behind schedule,' 'critical path blocked,' 'seeking urgent resolution.'`,
      'Business Growth': `AI identified emerging market opportunity through ${Math.floor(Math.random() * 3) + 2} strategic communications highlighting competitive gaps and customer demand signals.`,
      'Customer Success': `AI flagged customer satisfaction trends across ${Math.floor(Math.random() * 8) + 3} support interactions indicating potential churn risks and service quality concerns.`,
      'Team Dynamics': `AI analyzed team communication patterns revealing resource conflicts and collaboration barriers affecting project velocity and team morale.`,
      'Resource Management': `AI detected capacity constraints through workload analysis and scheduling conflicts requiring immediate resource allocation decisions.`,
      'General': `AI synthesized multiple data sources to identify external factors requiring leadership attention and strategic response planning.`
    };

    return contexts[item.impactArea as keyof typeof contexts] || contexts.General;
  };

  const generateRelevantCommunications = (item: RadarItem) => {
    const communications = [];
    const subjects = [
      `Re: ${item.summary.split(':')[0]} - URGENT`,
      `Fwd: Project ${item.impactArea} Delay Alert`,
      `Team Update: ${item.impactArea} Status`,
      `Client Escalation: ${item.summary}`,
      `Resource Request: ${item.impactArea} Support`
    ];

    for (let i = 0; i < Math.min(3 + Math.floor(Math.random() * 3), subjects.length); i++) {
      communications.push({
        id: `comm-${item.id}-${i}`,
        subject: subjects[i],
        sender: `colleague${i + 1}@company.com`,
        timestamp: new Date(Date.now() - (i + 1) * 60 * 60 * 1000).toISOString(),
        snippet: item.summary.substring(0, 80) + '...'
      });
    }

    return communications;
  };

  // Filter and sort data
  const filteredData = data
    .filter(item => {
      if (filterType === 'risks') return true; // For now, treat all as risks
      if (filterType === 'opportunities') return item.impactArea === 'Business Growth';
      return true;
    })
    .filter(item => filterArea === 'all' || item.impactArea === filterArea)
    .sort((a, b) => {
      if (sortBy === 'urgency') {
        const urgencyOrder = { High: 3, Medium: 2, Low: 1 };
        return urgencyOrder[b.urgencyScore] - urgencyOrder[a.urgencyScore];
      }
      if (sortBy === 'severity') {
        const severityOrder = { Critical: 3, Major: 2, Minor: 1 };
        return severityOrder[b.severityScore] - severityOrder[a.severityScore];
      }
      // Latest by default
      return b.id.localeCompare(a.id);
    });

  // Calculate node positions based on impact area and risk level
  const calculateNodePosition = (item: RadarItem, index: number, totalInCategory: number) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // Get impact area info
    const impactInfo = IMPACT_AREAS[item.impactArea as keyof typeof IMPACT_AREAS] || IMPACT_AREAS.General;

    // Calculate angle based on category (divide circle into segments)
    const categoryAngle = (Object.keys(IMPACT_AREAS).indexOf(item.impactArea) / Object.keys(IMPACT_AREAS).length) * 2 * Math.PI;

    // Calculate radius based on combined urgency/severity
    const urgencyValue = { Low: 1, Medium: 2, High: 3 }[item.urgencyScore];
    const severityValue = { Minor: 1, Major: 2, Critical: 3 }[item.severityScore];
    const combinedRisk = (urgencyValue + severityValue) / 2;

    // Map to radius (higher risk = closer to center)
    const maxRadius = 260;
    const minRadius = 80;
    const radius = maxRadius - ((combinedRisk - 1) / 2) * (maxRadius - minRadius);

    // Add some randomness within the segment to avoid overlapping
    const segmentWidth = (2 * Math.PI) / Object.keys(IMPACT_AREAS).length;
    const angleOffset = (index / totalInCategory - 0.5) * segmentWidth * 0.6; // Spread within segment
    const finalAngle = categoryAngle + angleOffset;

    return {
      x: centerX + Math.cos(finalAngle) * radius,
      y: centerY + Math.sin(finalAngle) * radius,
      radius: radius,
      riskLevel: combinedRisk
    };
  };

  // Group data by impact area for segment calculation
  const dataByCategory = filteredData.reduce((acc, item) => {
    const category = item.impactArea;
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, RadarItem[]>);

  // Generate SVG elements
  const renderHeatmap = () => {
    if (filteredData.length === 0) return null;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    return (
      <g>
        {/* Background circles (heat gradient) */}
        {[80, 140, 200, 260].map((radius, index) => (
          <circle
            key={`bg-${index}`}
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke={`rgba(${index === 0 ? '139, 195, 74' : index === 1 ? '255, 193, 7' : index === 2 ? '255, 87, 34' : '244, 67, 54'}, 0.1)`}
            strokeWidth="1"
          />
        ))}

        {/* Impact area segments */}
        {Object.entries(IMPACT_AREAS).map(([key, info], categoryIndex) => {
          const segmentAngle = (2 * Math.PI) / Object.keys(IMPACT_AREAS).length;
          const startAngle = categoryIndex * segmentAngle - Math.PI / 2; // Start from top
          const endAngle = (categoryIndex + 1) * segmentAngle - Math.PI / 2;

          const x1 = centerX + Math.cos(startAngle) * 280;
          const y1 = centerY + Math.sin(startAngle) * 280;
          const x2 = centerX + Math.cos(endAngle) * 280;
          const y2 = centerY + Math.sin(endAngle) * 280;

          const largeArcFlag = segmentAngle > Math.PI ? 1 : 0;

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A 280 280 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          return (
            <g key={`segment-${key}`}>
              <path
                d={pathData}
                fill={`rgba(${info.color.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ')}, 0.05)`}
                stroke={info.color}
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              {/* Segment label */}
              <text
                x={centerX + Math.cos(startAngle + segmentAngle / 2) * 320}
                y={centerY + Math.sin(startAngle + segmentAngle / 2) * 320}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="600"
                fill={info.color}
                className="font-semibold"
              >
                {info.icon} {info.label}
              </text>
            </g>
          );
        })}

        {/* Risk nodes */}
        {filteredData.map((item, index) => {
          const categoryItems = dataByCategory[item.impactArea] || [];
          const categoryIndex = categoryItems.indexOf(item);
          const position = calculateNodePosition(item, categoryIndex, categoryItems.length);

          const urgencyValue = { Low: 1, Medium: 2, High: 3 }[item.urgencyScore];
          const severityValue = { Minor: 1, Major: 2, Critical: 3 }[item.severityScore];
          const nodeColor = urgencyValue >= 3 ? '#ff4444' : severityValue >= 3 ? '#ff8800' : '#ffa500';

          // Extract concise topic for display
          const topicKeyword = item.summary.split(':')[0].replace(/^(Project|Customer|Team|Resource|Business) (.*?)(:| -)/, '$2').trim();

          return (
            <g key={`node-${item.id}`}>
              {/* Node circle with better visual hierarchy */}
              <circle
                cx={position.x}
                cy={position.y}
                r="14"
                fill={nodeColor}
                stroke="#fff"
                strokeWidth="3"
                className="cursor-pointer transition-all duration-200 hover:scale-110"
                onClick={() => setSelectedItem(generateAIInsights(item))}
              />

              {/* Priority indicator ring for high urgency items */}
              {item.urgencyScore === 'High' && (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="18"
                  fill="none"
                  stroke="#ff4444"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                  className="animate-pulse"
                />
              )}

              {/* AI-FLAGGED label */}
              <text
                x={position.x}
                y={position.y - 35}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#333"
                className="pointer-events-none"
              >
                AI-FLAGGED
              </text>

              {/* Topic keyword */}
              <text
                x={position.x}
                y={position.y - 20}
                textAnchor="middle"
                fontSize="8"
                fontWeight="600"
                fill="#fff"
                className="pointer-events-none"
              >
                {topicKeyword.length > 12 ? topicKeyword.substring(0, 12) + '...' : topicKeyword}
              </text>

              {/* Issue type indicator */}
              <text
                x={position.x}
                y={position.y + 3}
                textAnchor="middle"
                fontSize="10"
                fill="#fff"
                className="pointer-events-none font-medium"
              >
                {item.urgencyScore === 'High' ? '🚨' : item.severityScore === 'Critical' ? '⚠️' : '📊'}
              </text>

              {/* Hover tooltip on mouse enter for better UX */}
              <title>{`${item.impactArea}: ${item.summary} | Action: ${item.suggestedAction}`}</title>
            </g>
          );
        })}
      </g>
    );
  };

  // Generate top priorities for briefing card
  const topPriorities = filteredData
    .slice(0, 3)
    .map((item, index) => {
      // Extract clear, concise topic keywords
      const topicKeyword = item.summary.split(':')[0].replace(/^(Project|Customer|Team|Resource|Business) (.*?)(:| -)/, '$2').trim();
      const urgency = item.urgencyScore;

      return {
        rank: index + 1,
        topic: topicKeyword || item.impactArea,
        title: `${item.impactArea}: ${item.summary.split(':')[0]}`,
        action: item.suggestedAction,
        urgency: item.urgencyScore,
        severity: item.severityScore,
        summary: item.summary
      };
    });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center max-w-md">
          <div className="text-gray-400 text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Executive Risk Radar</h3>
          <p className="text-gray-500 mb-4">AI-powered insights will appear here once you connect your communication channels.</p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Connect Gmail Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterType('risks')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filterType === 'risks' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Risks Only
            </button>
            <button
              onClick={() => setFilterType('opportunities')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filterType === 'opportunities' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Opportunities
            </button>
          </div>

          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Impact Areas</option>
            {Object.entries(IMPACT_AREAS).map(([key, info]) => (
              <option key={key} value={key}>{info.icon} {info.label}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="urgency">Sort by Urgency</option>
            <option value="severity">Sort by Severity</option>
            <option value="latest">Sort by Latest</option>
          </select>
        </div>
      </div>

      {/* AI Prioritized Briefing Card */}
      {topPriorities.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🎯</span>
            <h3 className="text-lg font-semibold text-gray-900">AI Prioritized Briefing</h3>
          </div>
          <div className="space-y-2">
            {topPriorities.map(priority => (
              <div key={priority.rank} className="flex items-start gap-3 p-2 bg-white rounded-md border border-gray-100">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
                  {priority.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      {priority.topic}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      priority.urgency === 'High' ? 'bg-red-100 text-red-700' :
                      priority.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {priority.urgency}
                    </span>
                  </div>
                  <div className="text-sm text-gray-900 font-medium leading-tight mb-1">
                    {priority.title.split(': ')[1] || priority.title}
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    {priority.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Main Radar Visualization */}
        <div className="flex-1">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="overflow-visible"
          >
            {/* Background */}
            <rect width="100%" height="100%" fill="#fafafa" />

            {/* Title */}
            <text
              x={dimensions.width / 2}
              y="30"
              textAnchor="middle"
              fontSize="20"
              fontWeight="bold"
              fill="#333"
              className="font-bold"
            >
              AI-Driven Executive Risk & Opportunity Heatmap
            </text>

            <text
              x={dimensions.width / 2}
              y="50"
              textAnchor="middle"
              fontSize="14"
              fill="#666"
            >
              {filteredData.length} AI-identified insights across {Object.keys(dataByCategory).length} impact areas
            </text>

            {/* Main heatmap visualization */}
            {renderHeatmap()}

            {/* Center label */}
            <text
              x={dimensions.width / 2}
              y={dimensions.height / 2 + 5}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#666"
            >
              Critical
            </text>

            {/* Risk level labels */}
            <text x="20" y={dimensions.height / 2 - 60} fontSize="10" fill="#999">Low Risk</text>
            <text x="20" y={dimensions.height / 2} fontSize="10" fill="#999">Medium Risk</text>
            <text x="20" y={dimensions.height / 2 + 60} fontSize="10" fill="#999">High Risk</text>
          </svg>
        </div>

        {/* Detail Panel */}
        {selectedItem && (
          <div className="w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">AI-Identified Issue</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-white hover:text-gray-200 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="font-medium">{selectedItem.item.impactArea}: {selectedItem.item.summary.split(':')[0]}</p>
            </div>

            <div className="p-4 space-y-4">
              {/* Impact Area & Ratings */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {IMPACT_AREAS[selectedItem.item.impactArea as keyof typeof IMPACT_AREAS]?.icon || '📊'}
                  </span>
                  <span className="font-medium text-gray-900">
                    {IMPACT_AREAS[selectedItem.item.impactArea as keyof typeof IMPACT_AREAS]?.label || selectedItem.item.impactArea}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedItem.item.urgencyScore === 'High' ? 'bg-red-100 text-red-800' :
                    selectedItem.item.urgencyScore === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedItem.item.urgencyScore} Urgency
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedItem.item.severityScore === 'Critical' ? 'bg-red-100 text-red-800' :
                    selectedItem.item.severityScore === 'Major' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedItem.item.severityScore} Severity
                  </span>
                </div>
              </div>

              {/* AI Confidence Score */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">AI Confidence:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      selectedItem.confidenceScore >= 90 ? 'bg-green-500' :
                      selectedItem.confidenceScore >= 75 ? 'bg-yellow-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${selectedItem.confidenceScore}%` }}
                  />
                </div>
                <span className={`text-sm font-bold ${
                  selectedItem.confidenceScore >= 90 ? 'text-green-600' :
                  selectedItem.confidenceScore >= 75 ? 'text-yellow-600' : 'text-orange-600'
                }`}>
                  {selectedItem.confidenceScore}%
                </span>
              </div>

              {/* AI Context */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">AI Context & Key Signals</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedItem.aiContext}</p>
              </div>

              {/* Suggested Action */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Suggested Executive Action</h4>
                <p className="text-sm text-blue-700 font-medium bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                  {selectedItem.item.suggestedAction}
                </p>
              </div>

              {/* Relevant Communications */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Relevant Communications (AI-Filtered)</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedItem.relevantCommunications.map(comm => (
                    <div key={comm.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium text-gray-900">{comm.subject}</div>
                      <div className="text-gray-600 text-xs">
                        From: {comm.sender} • {new Date(comm.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors">
                  Acknowledge
                </button>
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                  In Progress
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

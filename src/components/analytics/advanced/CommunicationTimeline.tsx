'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown, 
  Calendar,
  Filter
} from 'lucide-react';

interface TimelineDataPoint {
  timestamp: string;
  hour: number;
  inbound: number;
  outbound: number;
  type: 'email' | 'slack' | 'meeting';
  day: string;
}

interface PatternInsight {
  type: 'peak' | 'valley' | 'trend' | 'anomaly';
  message: string;
  time: string;
  value: number;
  recommendation?: string;
}

// Generate realistic executive communication patterns
const generateTimelineData = (): TimelineDataPoint[] => {
  const data: TimelineDataPoint[] = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  
  // Generate last 7 days of hourly data
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const dayName = days[date.getDay()];
    
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date(date);
      timestamp.setHours(hour, 0, 0, 0);
      
      // Executive patterns: peak hours 9-11am, 2-4pm, lower evenings/weekends
      let baseInbound = 0;
      let baseOutbound = 0;
      
      if (dayName === 'Sat' || dayName === 'Sun') {
        // Weekend: much lower activity
        baseInbound = Math.random() * 2;
        baseOutbound = Math.random() * 1;
      } else {
        // Weekday patterns
        if (hour >= 9 && hour <= 11) {
          // Morning peak
          baseInbound = 8 + Math.random() * 12;
          baseOutbound = 4 + Math.random() * 6;
        } else if (hour >= 14 && hour <= 16) {
          // Afternoon peak
          baseInbound = 6 + Math.random() * 10;
          baseOutbound = 5 + Math.random() * 8;
        } else if (hour >= 7 && hour <= 18) {
          // Regular work hours
          baseInbound = 2 + Math.random() * 6;
          baseOutbound = 1 + Math.random() * 4;
        } else {
          // Off hours
          baseInbound = Math.random() * 3;
          baseOutbound = Math.random() * 1;
        }
      }
      
      data.push({
        timestamp: timestamp.toISOString(),
        hour,
        inbound: Math.floor(baseInbound),
        outbound: Math.floor(baseOutbound),
        type: hour >= 9 && hour <= 17 ? 'email' : 'slack',
        day: dayName
      });
    }
  }
  
  return data;
};

const mockTimelineData = generateTimelineData();

export function CommunicationTimeline() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [selectedType, setSelectedType] = useState<'all' | 'email' | 'slack' | 'meeting'>('all');
  
  const filteredData = useMemo(() => {
    let filtered = mockTimelineData;
    
    // Filter by time range
    const now = new Date();
    const cutoff = new Date();
    if (selectedTimeRange === '24h') {
      cutoff.setDate(now.getDate() - 1);
    } else if (selectedTimeRange === '7d') {
      cutoff.setDate(now.getDate() - 7);
    } else {
      cutoff.setDate(now.getDate() - 30);
    }
    
    filtered = filtered.filter(d => new Date(d.timestamp) >= cutoff);
    
    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(d => d.type === selectedType);
    }
    
    return filtered;
  }, [selectedTimeRange, selectedType]);

  // Generate insights from patterns
  const insights = useMemo((): PatternInsight[] => {
    const insights: PatternInsight[] = [];
    
    // Find peak hours
    const hourlyTotals = Array.from({ length: 24 }, (_, hour) => {
      const hourData = filteredData.filter(d => d.hour === hour);
      const total = hourData.reduce((sum, d) => sum + d.inbound + d.outbound, 0);
      return { hour, total };
    });
    
    const peakHour = hourlyTotals.reduce((max, curr) => 
      curr.total > max.total ? curr : max
    );
    
    if (peakHour.total > 0) {
      insights.push({
        type: 'peak',
        message: `Peak communication at ${peakHour.hour}:00`,
        time: `${peakHour.hour}:00`,
        value: peakHour.total,
        recommendation: 'Consider blocking this time for focused responses'
      });
    }
    
    // Find response ratio imbalance
    const totalInbound = filteredData.reduce((sum, d) => sum + d.inbound, 0);
    const totalOutbound = filteredData.reduce((sum, d) => sum + d.outbound, 0);
    const responseRatio = totalOutbound / (totalInbound || 1);
    
    if (responseRatio < 0.3) {
      insights.push({
        type: 'anomaly',
        message: 'Low response rate detected',
        time: 'Overall',
        value: Math.round(responseRatio * 100),
        recommendation: 'Consider dedicated response time blocks'
      });
    }
    
    // Weekend activity
    const weekendData = filteredData.filter(d => d.day === 'Sat' || d.day === 'Sun');
    const weekendTotal = weekendData.reduce((sum, d) => sum + d.inbound + d.outbound, 0);
    
    if (weekendTotal > 20) {
      insights.push({
        type: 'trend',
        message: 'High weekend activity',
        time: 'Weekends',
        value: weekendTotal,
        recommendation: 'Consider setting weekend boundaries'
      });
    }
    
    return insights;
  }, [filteredData]);

  // Calculate max values for scaling
  const maxValue = Math.max(
    ...filteredData.map(d => Math.max(d.inbound, d.outbound)),
    1
  );

  const getBarHeight = (value: number, maxHeight: number = 100) => {
    return (value / maxValue) * maxHeight;
  };

  const formatTime = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  // Group data for visualization
  const chartData = useMemo(() => {
    if (selectedTimeRange === '24h') {
      // Hourly view for last 24 hours
      return Array.from({ length: 24 }, (_, hour) => {
        const hourData = filteredData.filter(d => d.hour === hour);
        const inbound = hourData.reduce((sum, d) => sum + d.inbound, 0);
        const outbound = hourData.reduce((sum, d) => sum + d.outbound, 0);
        
        return {
          label: formatTime(hour),
          inbound,
          outbound,
          hour
        };
      });
    } else {
      // Daily aggregation
      const dayGroups = new Map<string, { inbound: number; outbound: number }>();
      
      filteredData.forEach(d => {
        const day = d.day;
        if (!dayGroups.has(day)) {
          dayGroups.set(day, { inbound: 0, outbound: 0 });
        }
        const group = dayGroups.get(day)!;
        group.inbound += d.inbound;
        group.outbound += d.outbound;
      });
      
      return Array.from(dayGroups.entries()).map(([day, data]) => ({
        label: day,
        inbound: data.inbound,
        outbound: data.outbound,
        hour: 0
      }));
    }
  }, [filteredData, selectedTimeRange]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Communication Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Time Range:</span>
              {(['24h', '7d', '30d'] as const).map(range => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Type:</span>
              {(['all', 'email', 'slack', 'meeting'] as const).map(type => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Inbound vs Outbound Messages</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Inbound</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Outbound</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Chart container */}
            <div className="flex items-end justify-center gap-1 h-64 p-4 bg-gray-50 rounded-lg overflow-x-auto">
              {chartData.map((point, index) => (
                <div key={index} className="flex flex-col items-center gap-1 min-w-[40px]">
                  {/* Bars */}
                  <div className="flex items-end gap-1 h-48">
                    {/* Inbound bar */}
                    <div
                      className="bg-blue-500 w-4 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${getBarHeight(point.inbound, 180)}px` }}
                      title={`Inbound: ${point.inbound}`}
                    />
                    {/* Outbound bar */}
                    <div
                      className="bg-green-500 w-4 rounded-t transition-all hover:bg-green-600"
                      style={{ height: `${getBarHeight(point.outbound, 180)}px` }}
                      title={`Outbound: ${point.outbound}`}
                    />
                  </div>
                  {/* Label */}
                  <span className="text-xs text-muted-foreground transform -rotate-45 origin-top-left whitespace-nowrap">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Communication Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No significant patterns detected in current timeframe
              </p>
            ) : (
              insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'peak' 
                      ? 'bg-blue-50 border-l-blue-500'
                      : insight.type === 'anomaly'
                      ? 'bg-red-50 border-l-red-500'
                      : insight.type === 'trend'
                      ? 'bg-green-50 border-l-green-500'
                      : 'bg-gray-50 border-l-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {insight.type === 'peak' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                        {insight.type === 'anomaly' && <TrendingDown className="w-4 h-4 text-red-600" />}
                        {insight.type === 'trend' && <Calendar className="w-4 h-4 text-green-600" />}
                        <span className="font-medium">{insight.message}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Time: {insight.time} • Value: {insight.value}
                        {insight.type === 'anomaly' && insight.value < 50 && '%'}
                      </p>
                      {insight.recommendation && (
                        <p className="text-sm text-blue-700 mt-2 font-medium">
                          💡 {insight.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  Zap, 
  Calendar,
  Settings,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BriefData {
  id: string;
  title: string;
  createdAt: string;
  status: 'generating' | 'completed' | 'error';
  style?: string;
}

interface BriefGenerationCardProps {
  recentBriefs: BriefData[];
  isGenerating?: boolean;
  onGenerateBrief?: () => void;
  onViewBrief?: (briefId: string) => void;
}

export function BriefGenerationCard({ 
  recentBriefs = [], 
  isGenerating = false,
  onGenerateBrief,
  onViewBrief 
}: BriefGenerationCardProps) {
  const router = useRouter();

  const getStatusBadge = (status: BriefData['status']) => {
    switch (status) {
      case 'generating':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-blue-50 text-blue-700">
            <Loader2 className="w-3 h-3 animate-spin" />
            Generating
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
            Ready
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="p-2 rounded-lg bg-white text-indigo-600">
              <FileText className="w-6 h-6" />
            </div>
            Brief Generation
          </CardTitle>
          <Button
            onClick={() => router.push('/digest/new')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Schedule
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button 
            onClick={onGenerateBrief}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Brief Now'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/briefs/current')}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            View Current
          </Button>
        </div>

        {/* Recent Briefs */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Briefs
          </h3>
          
          {recentBriefs.length > 0 ? (
            <div className="space-y-2">
              {recentBriefs.slice(0, 3).map((brief) => (
                <div 
                  key={brief.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm cursor-pointer transition-all"
                  onClick={() => onViewBrief?.(brief.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {brief.title}
                      </p>
                      {getStatusBadge(brief.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatDate(brief.createdAt)}</span>
                      {brief.style && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{brief.style.replace('_', ' ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              ))}
              
              {recentBriefs.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/briefs/past')}
                  className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  View all briefs ({recentBriefs.length})
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-lg border border-dashed border-gray-300">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">No briefs generated yet</p>
              <Button 
                onClick={onGenerateBrief}
                size="sm"
                variant="outline"
                disabled={isGenerating}
              >
                Create your first brief
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
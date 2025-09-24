'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  Eye, 
  Download, 
  Filter,
  Search,
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function PastBriefsPage() {
  const [briefs, setBriefs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBriefs() {
      try {
        const response = await fetch('/api/brief-data');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBriefs(data.briefs); // Assuming the API returns an object with a 'briefs' array
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBriefs();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('all');

  const filteredBriefs = briefs.filter(brief => {
    const matchesSearch = brief.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStyle = selectedStyle === 'all' || brief.style === selectedStyle;
    return matchesSearch && matchesStyle;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStyleBadgeColor = (style: string) => {
    switch (style) {
      case 'mission_brief': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'startup_velocity': return 'bg-green-100 text-green-700 border-green-200';
      case 'management_consulting': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'newsletter': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatStyleName = (style: string) => {
    return style.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Past Briefs</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search briefs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{briefs.length}</p>
              <p className="text-sm text-gray-600">Total Briefs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">3</p>
              <p className="text-sm text-gray-600">This Week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">86</p>
              <p className="text-sm text-gray-600">Total Emails</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">16</p>
              <p className="text-sm text-gray-600">Meetings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Briefs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Brief History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-900">Loading briefs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p className="text-lg font-medium mb-2">Error loading briefs:</p>
              <p>{error}</p>
            </div>
          ) : filteredBriefs.length > 0 ? (
            <div className="space-y-4">
              {filteredBriefs.map((brief) => (
                <div 
                  key={brief.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{brief.title}</h3>
                      <Badge className={`${getStyleBadgeColor(brief.style)} text-xs`}>
                        {formatStyleName(brief.style)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {brief.timeRange}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(brief.createdAt)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Sources:</span>
                        {brief.sources.map((source, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                      <div>
                        {brief.metrics.emails} emails, {brief.metrics.meetings} meetings
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No briefs found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Generate your first brief to get started'}
              </p>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

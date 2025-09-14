'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mail, Trash2, Eye, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface EmailSender {
  id: string;
  name: string;
  email: string;
  totalMessages: number;
  readCount: number;
  deletedCount: number;
  lastContact: string;
}

interface EmailSenderAnalyticsProps {
  senders?: EmailSender[];
  isLoading?: boolean;
  error?: string | null;
}

export function EmailSenderAnalytics({ senders = [], isLoading = false, error = null }: EmailSenderAnalyticsProps) {
  // Default to empty array if no senders provided
  const displaySenders = senders || [];
  
  const calculateReadPercentage = (sender: EmailSender) => {
    return Math.round((sender.readCount / sender.totalMessages) * 100) || 0;
  };

  const calculateDeletedPercentage = (sender: EmailSender) => {
    return Math.round((sender.deletedCount / sender.totalMessages) * 100) || 0;
  };

  const getEngagementLevel = (readPercentage: number) => {
    if (readPercentage > 70) return 'high';
    if (readPercentage > 30) return 'medium';
    return 'low';
  };
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-red-500">
            <p>Error loading email data: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p>Loading email analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!displaySenders.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p>No email data available. Connect your email to see analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Sender Analytics
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Shows top 5 senders by message volume with read/delete metrics</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sender</TableHead>
              <TableHead className="text-right">Messages</TableHead>
              <TableHead className="text-right">Read</TableHead>
              <TableHead className="text-right">Deleted</TableHead>
              <TableHead className="w-[200px]">Engagement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displaySenders.map((sender) => {
              const readPct = calculateReadPercentage(sender);
              const deletedPct = calculateDeletedPercentage(sender);
              const engagement = getEngagementLevel(readPct);
              
              return (
                <TableRow key={sender.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{sender.name}</span>
                      <span className="text-xs text-muted-foreground">{sender.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{sender.totalMessages}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{readPct}%</span>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{deletedPct}%</span>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            'h-full',
                            engagement === 'high' 
                              ? 'bg-green-500' 
                              : engagement === 'medium' 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                          )}
                          style={{ width: `${readPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {engagement.charAt(0).toUpperCase() + engagement.slice(1)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </div>
  );
}

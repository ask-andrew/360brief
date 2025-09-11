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

type Sender = {
  id: string;
  name: string;
  email: string;
  totalMessages: number;
  readCount: number;
  deletedCount: number;
  lastContact: string;
};

export function EmailSenderAnalytics() {
  // Mock data - replace with real data from your API
  const senders: Sender[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      totalMessages: 124,
      readCount: 45,
      deletedCount: 79,
      lastContact: '2 days ago',
    },
    {
      id: '2',
      name: 'Marketing Team',
      email: 'marketing@company.com',
      totalMessages: 89,
      readCount: 15,
      deletedCount: 74,
      lastContact: '1 day ago',
    },
    {
      id: '3',
      name: 'David Chen',
      email: 'david.chen@example.com',
      totalMessages: 67,
      readCount: 52,
      deletedCount: 15,
      lastContact: '5 hours ago',
    },
    {
      id: '4',
      name: 'Notifications',
      email: 'notifications@service.com',
      totalMessages: 210,
      readCount: 23,
      deletedCount: 187,
      lastContact: '3 hours ago',
    },
    {
      id: '5',
      name: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      totalMessages: 42,
      readCount: 38,
      deletedCount: 4,
      lastContact: '1 hour ago',
    },
  ];

  const calculateReadPercentage = (sender: Sender) => {
    return Math.round((sender.readCount / sender.totalMessages) * 100);
  };

  const calculateDeletedPercentage = (sender: Sender) => {
    return Math.round((sender.deletedCount / sender.totalMessages) * 100);
  };

  const getEngagementLevel = (readPercentage: number) => {
    if (readPercentage > 70) return 'high';
    if (readPercentage > 30) return 'medium';
    return 'low';
  };

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
            {senders.map((sender) => {
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

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useSenderMetrics } from '@/hooks/use-sender-metrics';
import { formatDistanceToNow } from 'date-fns';

export function SenderEngagementCard() {
  const { data: metrics, isLoading, error } = useSenderMetrics();

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Email Engagement by Sender</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Failed to load engagement data. Please try again later.
          </div>
        ) : metrics && metrics.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead className="text-right">Reply Rate</TableHead>
                  <TableHead className="text-right">Last Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric.sender_email}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{metric.sender_name || metric.sender_email}</span>
                        {metric.client_name && (
                          <span className="text-xs text-muted-foreground">{metric.client_name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <EngagementRate 
                        value={metric.open_rate} 
                        total={metric.total_received} 
                        type="open"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <EngagementRate 
                        value={metric.reply_rate} 
                        total={metric.total_received}
                        type="reply"
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {metric.last_interaction 
                        ? formatDistanceToNow(new Date(metric.last_interaction), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No engagement data available. Start interacting with emails to see metrics.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EngagementRate({ 
  value, 
  total,
  type 
}: { 
  value: number; 
  total: number;
  type: 'open' | 'reply';
}) {
  const percentage = Math.round(value * 100);
  let colorClass = '';
  
  if (type === 'open') {
    colorClass = value > 0.7 ? 'text-green-600' : value > 0.3 ? 'text-amber-600' : 'text-red-600';
  } else {
    colorClass = value > 0.5 ? 'text-green-600' : value > 0.2 ? 'text-amber-600' : 'text-red-600';
  }

  return (
    <div className="flex flex-col items-end">
      <span className={`font-medium ${colorClass}`}>
        {percentage}%
      </span>
      <span className="text-xs text-muted-foreground">
        {Math.round(total * value)}/{total}
      </span>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useUnreadEmails, useMarkAsRead, useMarkMultipleAsRead } from '@/hooks/use-gmail';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface EmailListProps {
  maxItems?: number;
  className?: string;
  showActions?: boolean;
}

export function EmailList({ 
  maxItems = 10, 
  className = '',
  showActions = true 
}: EmailListProps) {
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const { data: emails, isLoading, error, refetch } = useUnreadEmails({ maxResults: maxItems });
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markMultipleAsRead } = useMarkMultipleAsRead();

  const toggleSelectEmail = (emailId: string, checked: boolean) => {
    const newSelection = new Set(selectedEmails);
    if (checked) {
      newSelection.add(emailId);
    } else {
      newSelection.delete(emailId);
    }
    setSelectedEmails(newSelection);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!emails) return;
    
    if (checked) {
      setSelectedEmails(new Set(emails.map(email => email.id)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleMarkAsRead = (emailId: string) => {
    markAsRead(emailId);
  };

  const handleMarkSelectedAsRead = () => {
    if (selectedEmails.size === 0) return;
    
    markMultipleAsRead(Array.from(selectedEmails));
    setSelectedEmails(new Set());
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <EmailSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center">
          <Icons.alertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-600">Failed to load emails. Please try again.</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => refetch()}
          >
            <Icons.refreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center">
          <Icons.inbox className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No unread emails found</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={handleRefresh}
          >
            <Icons.refreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  const allSelected = selectedEmails.size > 0 && selectedEmails.size === emails.length;
  const someSelected = selectedEmails.size > 0 && selectedEmails.size < emails.length;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {showActions && (
            <Checkbox
              checked={allSelected}
              onCheckedChange={checked => toggleSelectAll(checked as boolean)}
              className={cn({
                'opacity-50': someSelected,
              })}
            />
          )}
          <CardTitle className="text-lg font-medium">Unread Emails</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          {selectedEmails.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkSelectedAsRead}
              className="text-sm"
            >
              <Icons.mailCheck className="mr-2 h-4 w-4" />
              Mark as read ({selectedEmails.size})
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            title="Refresh"
          >
            <Icons.refreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {emails.map((email) => (
            <div 
              key={email.id} 
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start space-x-3">
                {showActions && (
                  <Checkbox
                    checked={selectedEmails.has(email.id)}
                    onCheckedChange={(checked) => toggleSelectEmail(email.id, checked as boolean)}
                    className="mt-1"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium truncate">
                        {email.from.name || email.from.email}
                      </div>
                      {email.isUnread && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(email.date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <h3 className="font-medium mt-1">
                    {email.subject}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {email.snippet}
                  </p>
                  {showActions && (
                    <div className="mt-2 flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(email.id)}
                        className="h-8 text-xs"
                      >
                        <Icons.mailCheck className="mr-1 h-3 w-3" />
                        Mark as read
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          // TODO: Implement view email in modal
                        }}
                      >
                        <Icons.externalLink className="mr-1 h-3 w-3" />
                        View
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EmailSkeleton() {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Skeleton className="h-5 w-5 rounded mt-1" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex space-x-2 pt-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

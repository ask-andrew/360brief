'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

type PriorityItem = {
  id: string;
  title: string;
  urgency: number; // 1-5
  importance: number; // 1-5
  type: 'email' | 'task' | 'meeting';
};

type Quadrant = {
  label: string;
  items: PriorityItem[];
  color: string;
  bgColor: string;
};

export function PriorityMatrix({ items }: { items: PriorityItem[] }) {
  const quadrants = useMemo(() => {
    const result: Record<string, Quadrant> = {
      doFirst: {
        label: 'Do First',
        items: [],
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/30',
      },
      schedule: {
        label: 'Schedule',
        items: [],
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      },
      delegate: {
        label: 'Delegate',
        items: [],
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
      },
      dontDo: {
        label: 'Don\'t Do',
        items: [],
        color: 'text-gray-500 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-800',
      },
    };

    items.forEach((item) => {
      if (item.importance >= 4 && item.urgency >= 4) {
        result.doFirst.items.push(item);
      } else if (item.importance >= 4 && item.urgency < 4) {
        result.schedule.items.push(item);
      } else if (item.importance < 4 && item.urgency >= 4) {
        result.delegate.items.push(item);
      } else {
        result.dontDo.items.push(item);
      }
    });

    return result;
  }, [items]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return '📧';
      case 'task':
        return '✅';
      case 'meeting':
        return '📅';
      default:
        return '•';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Priority Matrix
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 h-[calc(100%-60px)]">
        {Object.entries(quadrants).map(([key, quadrant]) => (
          <div
            key={key}
            className={`p-3 rounded-lg h-full flex flex-col ${quadrant.bgColor}`}
          >
            <h3 className={`text-sm font-medium mb-2 ${quadrant.color}`}>
              {quadrant.label}
            </h3>
            <div className="space-y-1 flex-1 overflow-y-auto">
              {quadrant.items.length > 0 ? (
                quadrant.items.map((item) => (
                  <div
                    key={item.id}
                    className="text-xs p-2 bg-white dark:bg-gray-800 rounded flex items-start"
                  >
                    <span className="mr-2">{getTypeIcon(item.type)}</span>
                    <span className="truncate">{item.title}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  No items
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

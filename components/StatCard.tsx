import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  description 
}: StatCardProps) {
  const trendConfig = {
    up: {
      icon: ArrowUp,
      color: 'text-green-600 bg-green-50',
    },
    down: {
      icon: ArrowDown,
      color: 'text-red-600 bg-red-50',
    },
    neutral: {
      icon: Minus,
      color: 'text-gray-600 bg-gray-50',
    },
  }[trend || 'neutral'];

  const TrendIcon = trendConfig.icon;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && trendValue && (
          <div className={cn("mt-1 flex items-center text-xs rounded px-1.5 py-0.5 w-fit", trendConfig.color)}>
            <TrendIcon className="h-3 w-3" />
            <span className="ml-1">{trendValue}</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

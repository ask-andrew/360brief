import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type IntegrationCardProps = {
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  connectHref: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  isLoading?: boolean;
};

export function IntegrationCard({
  name,
  description,
  icon,
  connected,
  connectHref,
  onConnect,
  onDisconnect,
  isLoading = false,
}: IntegrationCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center space-x-4">
        <div className="p-2 rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <CardTitle className="text-lg">{name}</CardTitle>
          {connected && (
            <Badge className="mt-1" variant="outline">
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
      <CardFooter>
        {connected ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={onDisconnect}
            disabled={isLoading}
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={onConnect}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

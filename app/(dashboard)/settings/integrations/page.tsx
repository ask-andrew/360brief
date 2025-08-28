import { Metadata } from 'next';
import { NotionIntegration } from '@/components/integrations/NotionIntegration';

export const metadata: Metadata = {
  title: 'Integrations | 360Brief',
  description: 'Manage your third-party integrations',
};

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your favorite tools to 360Brief
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NotionIntegration />
        
        {/* Add more integration components as needed */}
      </div>
    </div>
  );
}

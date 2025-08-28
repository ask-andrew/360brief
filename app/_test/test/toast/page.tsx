'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function ToastTestPage() {
  const { toast } = useToast();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-4">
      <h1 className="text-2xl font-bold mb-8">Toast Notification Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
        <Button 
          variant="outline" 
          className="bg-green-100 hover:bg-green-200 text-green-800"
          onClick={() => {
            toast({
              title: "Success!",
              description: "This is a success message!",
              variant: "default",
            });
          }}
        >
          Show Success Toast
        </Button>
        
        <Button 
          variant="outline" 
          className="bg-blue-100 hover:bg-blue-200 text-blue-800"
          onClick={() => {
            toast({
              title: "Information",
              description: "Here's some information",
              variant: "default",
            });
          }}
        >
          Show Info Toast
        </Button>
        
        <Button 
          variant="outline" 
          className="bg-red-100 hover:bg-red-200 text-red-800"
          onClick={() => {
            toast({
              title: "Error",
              description: "Something went wrong!",
              variant: "destructive",
            });
          }}
        >
          Show Error Toast
        </Button>
      </div>
      
      <div className="mt-8 text-center max-w-md">
        <p className="text-gray-600">
          Click any button above to test the toast notifications.
          Each toast will automatically dismiss after 5 seconds.
        </p>
      </div>
    </div>
  );
}

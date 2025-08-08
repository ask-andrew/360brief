'use client';

import { ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { usePathname } from 'next/navigation';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const pathname = usePathname();
  const isAnalyticsPage = pathname?.startsWith('/analytics');
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <AppSidebar />
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Main content area */}
        <main className={`flex-1 overflow-y-auto focus:outline-none ${isAnalyticsPage ? 'bg-gray-50' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

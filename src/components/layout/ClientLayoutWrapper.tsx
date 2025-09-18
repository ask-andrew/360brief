'use client';

import { Providers } from '@/app/providers';
import { Footer } from './footer';

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
      </div>
    </Providers>
  );
}
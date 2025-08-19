'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}

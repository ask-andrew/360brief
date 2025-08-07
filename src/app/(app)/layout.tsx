import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <html lang="en" className="h-full bg-white">
      <body className={`${inter.className} h-full`}>
        <div className="flex h-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

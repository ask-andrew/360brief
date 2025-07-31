import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth0';

export default async function Home() {
  // Get the user session using our custom auth0 client
  const session = await getSession();
  
  // If user is already logged in, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-6">Welcome to 360Brief</h1>
        <p className="text-xl mb-8">
          Your executive dashboard for streamlined communication and insights.
          Consolidate multiple data sources into actionable intelligence.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/api/auth/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Get Started
          </Link>
          <Link 
            href="/dashboard" 
            className="border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            View Demo
          </Link>
        </div>
      </div>
    </main>
  );
}

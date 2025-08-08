'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { setDevSession, isDevSession } from '@/lib/dev-auth';

export default function DevLoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && isDevSession()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleDevLogin = () => {
    setDevSession();
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">Dev Login (Bypass)</h1>
        <p className="mb-6 text-gray-600 text-center">
          Authentication is <span className="font-semibold text-red-600">bypassed</span> in this mode.<br />
          You can access all pages for development and feedback.
        </p>
        <button
          onClick={handleDevLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold text-lg w-full mb-4"
        >
          Login as Dev
        </button>
        <div className="text-xs text-gray-400 mt-2">Not secure. For dev only.</div>
      </div>
    </div>
  );
}

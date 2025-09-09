'use client';

import { BetaWaitlist } from '@/components/marketing/BetaWaitlist';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BetaSignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Link 
          href="/"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Home
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-6 py-2 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20 mb-6">
              🚀 Now in beta — early access
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Join the 360Brief Beta
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Be among the first to experience AI-powered executive briefings. Transform your communication overload into actionable insights in minutes, not hours.
            </p>

            {/* Value Props */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/70 backdrop-blur rounded-xl p-6 shadow-sm border border-indigo-100">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Lightning Setup</h3>
                <p className="text-sm text-gray-600">Connect your accounts and get your first brief in under 5 minutes</p>
              </div>

              <div className="bg-white/70 backdrop-blur rounded-xl p-6 shadow-sm border border-indigo-100">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Privacy First</h3>
                <p className="text-sm text-gray-600">Your data is encrypted and processed securely with minimal storage</p>
              </div>

              <div className="bg-white/70 backdrop-blur rounded-xl p-6 shadow-sm border border-indigo-100">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Executive Ready</h3>
                <p className="text-sm text-gray-600">Get professional briefings with action items and priority insights</p>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <div className="flex justify-center">
            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-xl border border-indigo-100 max-w-md">
              <BetaWaitlist />
              <p className="text-xs text-gray-500 mt-4 text-center">
                Privacy-first: We store preferences, not raw sensitive data. Unsubscribe anytime.
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 text-center">
            <p className="text-sm font-medium text-gray-900 mb-4">Trusted by executives at</p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-gray-400">STARTUP</div>
              <div className="text-2xl font-bold text-gray-400">SCALEUP</div>
              <div className="text-2xl font-bold text-gray-400">ENTERPRISE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
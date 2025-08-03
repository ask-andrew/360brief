import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth0';
import { ArrowRight, Zap, BarChart2, MessageSquare, Shield, CheckCircle, Mail, Calendar } from 'lucide-react';
import TimeSavingCalculator from '../components/TimeSavingCalculator';

export default async function Home() {
  const session = await getSession();
  
  if (session?.user) {
    redirect('/dashboard');
  }

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: "Save Time",
      description: "Reduce hours of reading to minutes with AI-powered summaries"
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-blue-600" />,
      title: "Actionable Insights",
      description: "Clear signals about key projects, blockers, and achievements"
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
      title: "Unified View",
      description: "Consolidate emails, calendar, and project updates in one place"
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Privacy First",
      description: "We process and discard sensitive data, storing only what's necessary"
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Connect Your Accounts',
      description: 'Securely link your email, calendar, and project tools'
    },
    {
      number: '2',
      title: 'Set Your Preferences',
      description: 'Customize what matters most to you and your workflow'
    },
    {
      number: '3',
      title: 'Get Your Brief',
      description: 'Receive your personalized executive summary on your schedule'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mb-6">
            <Zap className="w-4 h-4 mr-2" />
            Now with Google Calendar integration
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Multiply Your Time,<br />
            <span className="text-blue-600 dark:text-blue-400">Not Your Workload</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
            Transform communication chaos into clear, actionable insights with 360Brief's executive dashboard.
            Get the signal through the noise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/api/auth/login" 
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              href="#how-it-works" 
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              See How It Works
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Time Saving Calculator */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            See How Much Time You Could Save
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Executives using 360Brief save an average of 10+ hours per week. Calculate your potential savings.
          </p>
        </div>
        <TimeSavingCalculator />
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How 360Brief Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Transform your workflow in three simple steps</p>
          </div>
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg font-bold mr-6">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Stay Ahead
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Transform how you consume and act on information
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Mail className="w-8 h-8 text-blue-600" />,
                title: "Email Intelligence",
                description: "AI-powered summarization of your most important emails, with smart prioritization and action items.",
                features: [
                  "Automatic prioritization",
                  "Action item extraction",
                  "Sentiment analysis"
                ]
              },
              {
                icon: <Calendar className="w-8 h-8 text-blue-600" />,
                title: "Smart Calendar",
                description: "Get prepped for meetings with context and action items from previous discussions.",
                features: [
                  "Meeting preparation",
                  "Follow-up tracking",
                  "Time optimization"
                ]
              },
              {
                icon: <BarChart2 className="w-8 h-8 text-blue-600" />,
                title: "Analytics Dashboard",
                description: "Visualize your time, priorities, and communication patterns at a glance.",
                features: [
                  "Time allocation",
                  "Priority tracking",
                  "Team insights"
                ]
              },
              {
                icon: <Shield className="w-8 h-8 text-blue-600" />,
                title: "Privacy First",
                description: "Your data stays yours. We process and discard sensitive information.",
                features: [
                  "End-to-end encryption",
                  "Minimal data retention",
                  "Enterprise-grade security"
                ]
              },
              {
                icon: <Zap className="w-8 h-8 text-blue-600" />,
                title: "Lightning Fast",
                description: "Get your brief in seconds, not hours. Optimized for busy executives.",
                features: [
                  "Instant updates",
                  "Offline access",
                  "Cross-device sync"
                ]
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-blue-600" />,
                title: "Actionable Insights",
                description: "Turn information into action with clear next steps and recommendations.",
                features: [
                  "Smart suggestions",
                  "Follow-up reminders",
                  "Priority scoring"
                ]
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your workflow?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join executives who are already saving hours every week with 360Brief.
          </p>
          <Link 
            href="/api/auth/login" 
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white hover:bg-gray-50 rounded-lg transition-all hover:shadow-lg"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <p className="mt-4 text-blue-100 text-sm">No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">360Brief</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Executive dashboard that transforms communication chaos into clear, actionable insights.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">About</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Privacy</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Terms</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} 360Brief. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

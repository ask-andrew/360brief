import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { ShieldCheck, Lock, EyeOff, Server, RefreshCw, Key, Database, Cpu, Shield, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security & Privacy | 360Brief',
  description: 'Learn how we protect your data and respect your privacy at 360Brief',
};

const SecurityFeature = ({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>, title: string, children: React.ReactNode }) => (
  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 h-full hover:border-blue-100">
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 bg-blue-50 rounded-xl">
        <Icon className="w-7 h-7 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 tracking-wide">{title}</h3>
    </div>
    <p className="text-gray-700 leading-relaxed tracking-normal">{children}</p>
  </div>
);

export default function SecurityPrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-wide">
            Security & Privacy
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed tracking-normal">
            Your trust is our top priority. We're committed to helping you manage your communication channels without keeping your data.
          </p>
        </div>

      {/* Our Philosophy */}
      <div className="bg-blue-50 rounded-xl p-8 mb-16">
        <div className="flex items-center mb-6">
          <Shield className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Our Privacy Philosophy</h2>
        </div>
        <p className="text-gray-700 mb-6">
          At 360Brief, we believe in <span className="font-semibold text-blue-700">managing your communications, not storing them</span>. 
          Our platform is designed to help you stay on top of your messages and schedules while keeping your data under your control.
        </p>
        <p className="text-gray-700">
          We process your information to provide valuable insights and summaries, but we <span className="font-semibold">never store the raw data</span> from your connected accounts.
        </p>
      </div>

      {/* Data Flow */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How We Handle Your Data</h2>
        <div className="space-y-8">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full mr-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Data Collection</h3>
              <p className="text-gray-600">
                We access only what's necessary to provide our service. This includes message headers, senders, and timestamps, but never the full content or attachments.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full mr-4">
              <Cpu className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Processing</h3>
              <p className="text-gray-600">
                Your data is processed in memory to generate insights and summaries. This happens in real-time, and we don't store the raw data after processing.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full mr-4">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Retention</h3>
              <p className="text-gray-600">
                We only keep the minimum data needed to provide our service. Most data is processed and discarded immediately after generating your brief.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Storage */}
      <div className="bg-white border border-gray-100 rounded-xl p-8 mb-16 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Store vs. What We Don't</h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="font-medium text-green-700 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Information We Keep
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5">•</div>
                <span className="ml-2 text-gray-700">Your account preferences and settings</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5">•</div>
                <span className="ml-2 text-gray-700">Derived insights and summaries (without personal data)</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5">•</div>
                <span className="ml-2 text-gray-700">Encrypted connection tokens (to maintain your integrations)</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-red-700 mb-4 flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              Information We Never Store
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-red-500 mt-0.5">•</div>
                <span className="ml-2 text-gray-700">Email content or message bodies</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-red-500 mt-0.5">•</div>
                <span className="ml-2 text-gray-700">File attachments or shared documents</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-red-500 mt-0.5">•</div>
                <span className="ml-2 text-gray-700">Calendar event details beyond time and participants</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-red-500 mt-0.5">•</div>
                <span className="ml-2 text-gray-700">Contact information from your address book</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-red-500 mt-0.5">•</div>
                <span className="ml-2 text-gray-700">Raw data from connected services after processing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Our Commitment */}
      <div className="bg-blue-50 rounded-xl p-8 mb-16">
        <div className="flex items-center mb-6">
          <ShieldCheck className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Our Commitment to You</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Transparent Operations</h3>
            <p className="text-gray-700">
              We believe in complete transparency about our data practices. If you have questions about how we handle your information, we're happy to provide details.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Your Control</h3>
            <p className="text-gray-700">
              You can disconnect any connected account at any time, and we'll immediately stop processing data from that source. All associated data can be deleted upon request.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Continuous Improvement</h3>
            <p className="text-gray-700">
              We regularly review and update our security practices to ensure we're meeting the highest standards of data protection and privacy.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">How is my data protected during processing?</h3>
            <p className="text-gray-600">
              All data in transit is encrypted using TLS 1.3. Our processing happens in secure, isolated environments with strict access controls. We use industry-standard encryption and security practices throughout our infrastructure.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Can I export or delete my data?</h3>
            <p className="text-gray-600">
              Yes, you can export your preferences and summaries at any time. To delete your account and all associated data, simply go to your account settings. This action is immediate and irreversible.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">How do you ensure compliance with privacy regulations?</h3>
            <p className="text-gray-600">
              We're committed to complying with all applicable privacy regulations, including GDPR and CCPA. Our privacy-first approach means we collect the minimum data necessary and provide you with control over your information.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          We're committed to being transparent about our security and privacy practices. If you have additional questions, please don't hesitate to reach out.
        </p>
        <a
          href="mailto:security@360brief.com"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Contact Our Security Team
        </a>
      </div>
      </main>
    </div>
  );
}

import { Metadata } from 'next';
import { ShieldCheck, Lock, EyeOff, Server, RefreshCw, Key, Database, Cpu } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security & Privacy | 360Brief',
  description: 'Learn how we protect your data and respect your privacy at 360Brief',
};

const SecurityFeature = ({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>, title: string, children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="text-gray-600">{children}</p>
  </div>
);

export default function SecurityPrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Security & Privacy</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your trust is our top priority. Here's how we protect your data and respect your privacy.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-16">
        <SecurityFeature icon={Lock} title="End-to-End Encryption">
          All data in transit is encrypted using TLS 1.3. We use industry-standard encryption algorithms to protect your information.
        </SecurityFeature>
        
        <SecurityFeature icon={EyeOff} title="Minimal Data Retention">
          We only store what's necessary to provide our service. Raw emails and attachments are processed and discarded immediately.
        </SecurityFeature>
        
        <SecurityFeature icon={Server} title="Secure Infrastructure">
          Our systems are hosted on enterprise-grade cloud infrastructure with strict access controls and regular security audits.
        </SecurityFeature>
        
        <SecurityFeature icon={RefreshCw} title="Process & Discard">
          We follow a process-and-discard approach, keeping only the insights you need while discarding sensitive raw data.
        </SecurityFeature>
      </div>

      <div className="bg-blue-50 rounded-xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Store vs. What We Don't</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium text-green-700 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              We Store
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                <span className="ml-2 text-gray-700">Your account preferences and settings</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                <span className="ml-2 text-gray-700">Derived insights and summaries</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                <span className="ml-2 text-gray-700">Connection tokens (encrypted)</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-red-700 mb-4 flex items-center">
              <Cpu className="w-5 h-5 mr-2" />
              We Don't Store
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-red-500">×</div>
                <span className="ml-2 text-gray-700">Raw email content</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-red-500">×</div>
                <span className="ml-2 text-gray-700">Email attachments</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-red-500">×</div>
                <span className="ml-2 text-gray-700">Calendar meeting details</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">How is my data protected?</h3>
            <p className="text-gray-600">
              We use industry-standard encryption both in transit (TLS 1.3) and at rest. All stored data is encrypted using AES-256 encryption.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Who has access to my data?</h3>
            <p className="text-gray-600">
              Only authorized personnel have access to our systems, and only when necessary to provide support. We maintain strict access controls and audit logs.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">How can I delete my data?</h3>
            <p className="text-gray-600">
              You can delete your account and all associated data at any time through your account settings. This action is immediate and irreversible.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Have more questions?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          We're committed to being transparent about our security practices. If you have additional questions, please contact our security team.
        </p>
        <a
          href="mailto:security@360brief.com"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Contact Security Team
        </a>
      </div>
    </div>
  );
}

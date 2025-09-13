import { Metadata } from 'next';
import { Mail, MessageSquare, Twitter, Linkedin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us - 360Brief',
  description: 'Get in touch with the 360Brief team for support, questions, or feedback.',
};

export default function ContactPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We'd love to hear from you! Reach out with any questions, feedback, or support needs.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-xl mr-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">Email Us</h2>
          </div>
          <p className="text-gray-600 mb-6">
            For general inquiries, partnership opportunities, or press inquiries, please email us at:
          </p>
          <a 
            href="mailto:hello@360brief.com" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <Mail className="w-5 h-5 mr-2" />
            hello@360brief.com
          </a>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-xl mr-4">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">Support</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Need help with your account or have technical questions? Our support team is here to help.
          </p>
          <a 
            href="mailto:support@360brief.com" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <Mail className="w-5 h-5 mr-2" />
            support@360brief.com
          </a>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6">Connect With Us</h2>
        <div className="flex space-x-6">
          <a 
            href="https://twitter.com/360brief" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-blue-500 transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-6 h-6" />
          </a>
          <a 
            href="https://linkedin.com/company/360brief" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-blue-700 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-6 h-6" />
          </a>
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-gray-500">
        <p>We typically respond to all inquiries within 24-48 hours.</p>
        <p className="mt-2">For urgent matters, please include "URGENT" in your subject line.</p>
      </div>
    </main>
  );
}

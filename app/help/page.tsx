import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help & Support - 360Brief',
  description: 'Get help and support for using 360Brief services.',
};

export default function HelpPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-8">Help & Support</h1>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <p className="mb-4">
            Welcome to 360Brief! Here's how to get started with our service:
          </p>
          <ol className="list-decimal pl-6 space-y-2 mb-6">
            <li>Connect your email and calendar accounts</li>
            <li>Set your notification preferences</li>
            <li>Customize your briefing schedule</li>
            <li>Start receiving your personalized briefings</li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">How do I connect my email?</h3>
              <p className="text-gray-700">
                Go to your account settings and click on "Connect Email" to link your Gmail or other email provider.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Can I customize my briefing schedule?</h3>
              <p className="text-gray-700">
                Yes! You can set your preferred briefing times in the notification settings.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Is my data secure?</h3>
              <p className="text-gray-700">
                Absolutely. We use industry-standard encryption and never store your email credentials. 
                Your data privacy is our top priority.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Contact Support</h2>
          <p className="mb-4">
            Need more help? Our support team is here to assist you.
          </p>
          <div className="space-y-2">
            <p className="text-gray-700">📧 Email: <a href="mailto:support@360brief.com" className="text-blue-600 hover:underline">support@360brief.com</a></p>
            <p className="text-gray-700">📞 Phone: (555) 123-4567</p>
            <p className="text-gray-700">🕒 Support Hours: Monday - Friday, 9 AM - 6 PM EST</p>
          </div>
        </section>
      </div>
    </main>
  );
}

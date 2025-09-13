import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - 360Brief',
  description: 'Learn how 360Brief handles your data with our comprehensive privacy policy.',
};

export default function PrivacyPolicy() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-lg text-gray-600 mb-8">
          Last Updated: September 13, 2024
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            At 360Brief, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <h3 className="text-xl font-medium mb-2">2.1 Information You Provide</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Account information (name, email address)</li>
            <li>Communication preferences</li>
            <li>Support requests and feedback</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">2.2 Information from Connected Accounts</h3>
          <p className="mb-4">When you connect third-party services (e.g., Google), we may access:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Message headers (senders, recipients, subjects, timestamps)</li>
            <li>Calendar metadata (event times, participants, titles)</li>
            <li>Basic profile information (name, email, timezone)</li>
          </ul>
          <p className="italic">We never store the content of your emails, message bodies, or file attachments.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Provide and maintain our service</li>
            <li>Generate personalized briefs and insights</li>
            <li>Improve and optimize our service</li>
            <li>Communicate with you about your account</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">4. Data Processing and Retention</h2>
          <h3 className="text-xl font-medium mb-2">4.1 Processing</h3>
          <p className="mb-4">
            Your data is processed in memory to generate insights and summaries. This happens in real-time, and we don't store the raw data after processing.
          </p>
          
          <h3 className="text-xl font-medium mb-2">4.2 Retention</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Account data: Retained until account deletion</li>
            <li>Connection tokens: Encrypted and stored to maintain integrations</li>
            <li>Raw message and calendar data: Processed in memory and immediately discarded</li>
            <li>Derived insights: Stored only as needed to provide the service</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">5. Google API Services</h2>
          <p className="mb-4">
            Our use and transfer of information received from Google APIs will adhere to the 
            <Link href="https://developers.google.com/terms/api-services-user-data-policy" 
                  className="text-blue-600 hover:underline ml-1"
                  target="_blank"
                  rel="noopener noreferrer">
              Google API Services User Data Policy
            </Link>, including the Limited Use requirements.
          </p>
          <p className="mb-4">
            We only request the minimum scopes necessary to provide our service, and our use of Google user data is limited to:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Facilitating the functionality of our application</li>
            <li>Providing you with insights and summaries of your communications</li>
            <li>Improving the quality and security of our service</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
          <p className="mb-4">We implement appropriate technical and organizational measures to protect your personal information, including:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Encryption of data in transit using TLS 1.3</li>
            <li>Secure processing environments with strict access controls</li>
            <li>Regular security assessments and updates</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccuracies in your information</li>
            <li>Request deletion of your account and data</li>
            <li>Export your data in a machine-readable format</li>
            <li>Withdraw consent for data processing</li>
          </ul>
          <p>To exercise these rights, please contact us at <a href="mailto:privacy@360brief.com" className="text-blue-600 hover:underline">privacy@360brief.com</a>.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We'll notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@360brief.com" className="text-blue-600 hover:underline">privacy@360brief.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - 360Brief',
  description: 'Terms and conditions for using 360Brief services.',
};

export default function TermsOfService() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <p className="text-lg text-gray-600 mb-8">
          Last Updated: September 13, 2024
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using the 360Brief service ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="mb-4">
            360Brief provides an executive briefing platform that helps users manage and understand their communications from various sources. The Service processes your connected account data to provide insights and summaries.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
          <p className="mb-4">You agree to:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Provide accurate and complete information when creating an account</li>
            <li>Maintain the security of your account credentials</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Not use the Service for any illegal or unauthorized purpose</li>
            <li>Be responsible for all activities that occur under your account</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">4. Data Handling</h2>
          <p className="mb-4">
            Our data handling practices are outlined in our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>. By using the Service, you consent to our collection and use of your data as described in the Privacy Policy.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">5. Service Modifications</h2>
          <p className="mb-4">
            360Brief reserves the right to modify or discontinue the Service at any time without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
          <p className="mb-4">
            To the maximum extent permitted by law, 360Brief shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">7. Governing Law</h2>
          <p className="mb-4">
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 360Brief is established, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:legal@360brief.com" className="text-blue-600 hover:underline">legal@360brief.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}

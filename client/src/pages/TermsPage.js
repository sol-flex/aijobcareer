const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="text-gray-600 mb-8">Last updated: January 9, 2026</p>

      <div className="prose prose-lg max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
          <p className="text-gray-700 mb-4">
            By accessing or using Legend ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="text-gray-700 mb-4">
            Legend is a job board platform that connects job seekers with employers in the AI, crypto, and technology industries. We provide:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Job listing aggregation and display</li>
            <li>Resume upload and matching services</li>
            <li>Job posting services for employers</li>
            <li>Email notifications about job opportunities</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Registration</h2>
          <h3 className="text-xl font-semibold mb-3">3.1 Job Seekers</h3>
          <p className="text-gray-700 mb-4">
            When you upload a resume, you provide your email address and agree to receive job notifications. You represent that:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>The information you provide is accurate and truthful</li>
            <li>You own or have rights to the resume content you upload</li>
            <li>You are at least 18 years old</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.2 Employers</h3>
          <p className="text-gray-700 mb-4">
            When posting jobs, you represent that:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>You have authority to post jobs on behalf of your organization</li>
            <li>Job postings are accurate and not misleading</li>
            <li>You comply with all applicable employment laws</li>
            <li>You will not discriminate based on protected characteristics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
          <p className="text-gray-700 mb-3">You agree NOT to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Post false, misleading, or fraudulent job listings</li>
            <li>Use the Platform for any illegal purpose</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Scrape or harvest data from the Platform without permission</li>
            <li>Attempt to gain unauthorized access to the Platform</li>
            <li>Upload malware, viruses, or malicious code</li>
            <li>Impersonate another person or entity</li>
            <li>Spam or send unsolicited communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Job Postings and Payments</h2>
          <h3 className="text-xl font-semibold mb-3">5.1 Pricing</h3>
          <p className="text-gray-700 mb-4">
            Job posting prices are displayed at the time of purchase. All fees are non-refundable except as required by law.
          </p>

          <h3 className="text-xl font-semibold mb-3">5.2 Job Posting Duration</h3>
          <p className="text-gray-700 mb-4">
            Job postings remain active for 30 days from the date of publication unless otherwise specified. Jobs may be removed if they violate these Terms.
          </p>

          <h3 className="text-xl font-semibold mb-3">5.3 Payment Processing</h3>
          <p className="text-gray-700 mb-4">
            Payments are processed through Stripe. By making a payment, you agree to Stripe's terms of service. We do not store your payment card information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
          <h3 className="text-xl font-semibold mb-3">6.1 Platform Content</h3>
          <p className="text-gray-700 mb-4">
            All content on the Platform, including design, logos, text, graphics, and software, is owned by Legend or our licensors and protected by copyright and trademark laws.
          </p>

          <h3 className="text-xl font-semibold mb-3">6.2 User Content</h3>
          <p className="text-gray-700 mb-4">
            You retain ownership of content you submit (resumes, job postings). By submitting content, you grant us a worldwide, non-exclusive license to use, display, and distribute your content for the purpose of operating the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Disclaimers</h2>
          <p className="text-gray-700 mb-4">
            <strong>THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</strong> We do not guarantee:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>That you will find employment through the Platform</li>
            <li>The accuracy or legitimacy of job postings</li>
            <li>That the Platform will be uninterrupted or error-free</li>
            <li>That defects will be corrected</li>
          </ul>
          <p className="text-gray-700 mb-4">
            We are a platform connecting job seekers and employers. We do not employ anyone directly and are not responsible for employment decisions, hiring practices, or workplace conditions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, LEGEND SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, ARISING FROM YOUR USE OF THE PLATFORM.
          </p>
          <p className="text-gray-700 mb-4">
            Our total liability shall not exceed the amount you paid us in the 12 months prior to the event giving rise to liability, or $100, whichever is greater.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
          <p className="text-gray-700 mb-4">
            You agree to indemnify and hold harmless Legend from any claims, damages, losses, or expenses arising from:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Your use of the Platform</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
            <li>Content you submit to the Platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to suspend or terminate your access to the Platform at any time, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
          <p className="text-gray-700 mb-4">
            We may modify these Terms at any time. Material changes will be notified by email or through a prominent notice on the Platform. Your continued use after changes constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
          <p className="text-gray-700 mb-4">
            These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles. Any disputes shall be resolved in the courts of California.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
          <p className="text-gray-700 mb-4">
            For questions about these Terms, please contact us at:
          </p>
          <p className="text-gray-700">
            <strong>Email:</strong> legendjobinquiries@gmail.com
          </p>
        </section>

        <section className="bg-gray-50 p-6 rounded-lg mt-8">
          <p className="text-sm text-gray-600">
            By using Legend, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;

const PrivacyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-gray-600 mb-8">Last updated: January 9, 2026</p>

      <div className="prose prose-lg max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            Welcome to Legend ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our job board platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <h3 className="text-xl font-semibold mb-3">2.1 Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Resume Information:</strong> When you upload your resume, we collect your email address and resume file (PDF, DOC, or DOCX format).</li>
            <li><strong>Job Posting Information:</strong> If you post a job, we collect company information, job details, and payment information.</li>
            <li><strong>Search Data:</strong> We collect information about your job searches, including keywords and location preferences.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.2 Automatically Collected Information</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Usage Data:</strong> We collect information about how you interact with our platform, including pages viewed, links clicked, and time spent on pages.</li>
            <li><strong>Device Information:</strong> We collect device type, browser type, IP address, and operating system.</li>
            <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to enhance your experience (see Section 6).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-700 mb-3">We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Match job seekers with relevant job opportunities</li>
            <li>Notify you about job opportunities that match your resume and preferences</li>
            <li>Process job postings and payments</li>
            <li>Improve our platform and user experience</li>
            <li>Communicate with you about platform updates and opportunities</li>
            <li>Prevent fraud and ensure platform security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
          <p className="text-gray-700 mb-3">We may share your information with:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Employers:</strong> If you apply to a job or upload your resume, we may share your information with relevant employers.</li>
            <li><strong>Service Providers:</strong> We work with third-party service providers for hosting, analytics, payment processing, and email delivery.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety.</li>
          </ul>
          <p className="text-gray-700 mb-4">
            <strong>We do not sell your personal information to third parties.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p className="text-gray-700 mb-4">
            We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
          <p className="text-gray-700 mb-4">
            We use cookies and similar tracking technologies to remember your preferences and improve your experience. We use localStorage to remember if you've uploaded a resume so we don't repeatedly prompt you.
          </p>
          <p className="text-gray-700 mb-4">
            You can control cookies through your browser settings, but disabling cookies may affect platform functionality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
          <p className="text-gray-700 mb-3">Depending on your location, you may have the following rights:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Access:</strong> Request access to your personal information</li>
            <li><strong>Correction:</strong> Request correction of inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
            <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
          </ul>
          <p className="text-gray-700 mb-4">
            To exercise these rights, please contact us at the email address below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
          <p className="text-gray-700 mb-4">
            We retain your information for as long as necessary to provide our services and comply with legal obligations. Resumes and job applications are retained for up to 2 years unless you request deletion.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
          <p className="text-gray-700 mb-4">
            Our platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have questions about this Privacy Policy or our privacy practices, please contact us at:
          </p>
          <p className="text-gray-700">
            <strong>Email:</strong> legendjobinquiries@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;

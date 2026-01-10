const CreateJobPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-6">
      <div className="max-w-4xl mx-auto p-6 pt-28">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Post a Job on Legend</h1>
        <p className="text-xl text-gray-600">Reach top talent in AI, Crypto, and Tech</p>
      </div>

      {/* Pricing Section */}
      <div className="bg-card rounded-lg shadow-lg p-8 mb-8 border-2 border-primary">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">30-Day Job Posting</h2>
          <div className="text-5xl font-bold text-primary mb-2">$149</div>
          <p className="text-gray-600">One-time payment</p>
        </div>

        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-lg mb-3">What's included:</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>30 days of visibility on Legend job board</span>
            </div>
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Featured in search results</span>
            </div>
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sent to matching candidates via email</span>
            </div>
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Company logo and branding included</span>
            </div>
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No additional fees or hidden costs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-card rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Post Your Job?</h2>
        <p className="text-gray-600 mb-6">
          Contact us to get started. We'll help you create and publish your job posting.
        </p>

        <div className="mb-6">
          <a
            href="mailto:legendjobinquiries@gmail.com?subject=Job Posting Inquiry"
            className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:opacity-90 font-bold text-lg transition-opacity"
          >
            Email Us to Post a Job
          </a>
        </div>

        <div className="text-gray-600">
          <p className="mb-2">
            <strong>Email:</strong> legendjobinquiries@gmail.com
          </p>
          <p className="text-sm">
            We typically respond within 24 hours
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">How long does it take to publish my job?</h3>
            <p className="text-gray-600">Once we receive your job details and payment, we'll publish your posting within 24 hours.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Can I edit my job posting after it's live?</h3>
            <p className="text-gray-600">Yes! Contact us anytime and we'll update your posting for free.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">We accept all major credit cards, PayPal, and bank transfers.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Do you offer refunds?</h3>
            <p className="text-gray-600">Yes, we offer a full refund within 7 days if you're not satisfied with the results.</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default CreateJobPage;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateJobPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(''); // Add this line
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    primaryRole: 'Engineering', // Default value
    positionType: 'Full-Time', // Default value

    // Company Info
    company: '',
    companyLogo: '',
    
    // Location
    locationType: 'On Site',
    locations: '',
    
    // Details
    description: '',
    keywords: '',
    
    // Compensation
    currency: 'USD',
    salaryMin: '',
    salaryMax: '',
    equityMin: '',
    equityMax: '',
    cryptoPayment: false,
    
    // How to Apply
    applicationMethod: 'Apply by website',
    applicationUrl: '',
    applicationEmail: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            paymentStatus: 'pending',
            published: false
        })
      });
      if (!response.ok) throw new Error('Failed to create job');
      const { _id: jobId } = await response.json();

      localStorage.setItem('pendingJobId', jobId);

      window.location.href = 'https://buy.stripe.com/test_14kcN7eCZ5Sid4Q4gi';

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 pt-28">
      <h1 className="text-4xl font-bold mb-8 text-center">Post a New Job</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Info Section */}    
        <section className="space-y-4">
            <h2 className="text-xl font-semibold">Tell us about your company</h2>
            
            <div>
                <label className="block mb-2">Company Name</label>
                <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                />
            </div>

            <div>
                <label className="block mb-2">Company Logo URL (optional)</label>
                <input
                type="url"
                name="companyLogo"
                value={formData.companyLogo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="w-full p-2 border rounded"
                />
                <p className="text-sm text-gray-500 mt-1">Provide a URL to your company logo image</p>
            </div>
        </section>
        {/* Position Details Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Tell us about the position</h2>
          
          <div>
            <label className="block mb-2">Job Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-2">Primary Role</label>
            <select
              name="primaryRole"
              value={formData.primaryRole}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option>Engineering</option>
              <option>Design</option>
              <option>Product</option>
              <option>Marketing</option>
              {/* Add more options */}
            </select>
          </div>

          <div>
            <label className="block mb-2">Type of Position</label>
            <div className="space-y-2">
              {['Full-Time', 'Part-Time', 'Contract', 'Freelance', 'Internship'].map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="positionType"
                    value={type}
                    checked={formData.positionType === type}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Location</h2>
          
          <div className="space-y-2">
            {['On Site', 'On Site or Remote', 'Remote'].map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="radio"
                  name="locationType"
                  value={type}
                  checked={formData.locationType === type}
                  onChange={handleChange}
                  className="mr-2"
                />
                {type}
              </label>
            ))}
          </div>

          {formData.locationType !== 'Remote' && (
            <div>
              <label className="block mb-2">Location(s)</label>
              <input
                type="text"
                name="locations"
                value={formData.locations}
                onChange={handleChange}
                placeholder="e.g. New York, London, Tokyo"
                className="w-full p-2 border rounded"
              />
              <p className="text-sm text-gray-500 mt-1">Please use commas to separate multiple locations.</p>
            </div>
          )}
        </section>

        {/* Description Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Job Description</h2>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="8"
            required
            className="w-full p-2 border rounded"
          />
          <p className="text-sm text-gray-500">You can use Markdown to format your job description.</p>
        </section>

        {/* Keywords Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Keywords (optional)</h2>
          <input
            type="text"
            name="keywords"
            value={formData.keywords}
            onChange={handleChange}
            placeholder="e.g. Bitcoin, DeFi, Non-Tech, Solidity"
            className="w-full p-2 border rounded"
          />
          <p className="text-sm text-gray-500">Please use commas to separate multiple keywords.</p>
        </section>

        {/* Compensation Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Compensation</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-2">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                {/* Add more currencies */}
              </select>
            </div>
            
            <div>
              <label className="block mb-2">Minimum Salary</label>
              <input
                type="number"
                name="salaryMin"
                value={formData.salaryMin}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block mb-2">Maximum Salary</label>
              <input
                type="number"
                name="salaryMax"
                value={formData.salaryMax}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Minimum Equity</label>
              <input
                type="number"
                name="equityMin"
                value={formData.equityMin}
                onChange={handleChange}
                step="0.01"
                placeholder="0.01"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block mb-2">Maximum Equity</label>
              <input
                type="number"
                name="equityMax"
                value={formData.equityMax}
                onChange={handleChange}
                step="0.01"
                placeholder="1.0"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="cryptoPayment"
              checked={formData.cryptoPayment}
              onChange={handleChange}
              className="mr-2"
            />
            Option to get paid in digital currency
          </label>
        </section>

        {/* How to Apply Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">How to Apply</h2>
          
          <div className="space-y-2">
            {['Apply by website', 'Apply by email'].map(method => (
              <label key={method} className="flex items-center">
                <input
                  type="radio"
                  name="applicationMethod"
                  value={method}
                  checked={formData.applicationMethod === method}
                  onChange={handleChange}
                  className="mr-2"
                />
                {method}
              </label>
            ))}
          </div>

          {formData.applicationMethod === 'Apply by website' ? (
            <div>
              <label className="block mb-2">Application URL</label>
              <input
                type="url"
                name="applicationUrl"
                value={formData.applicationUrl}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
          ) : (
            <div>
              <label className="block mb-2">Application Email</label>
              <input
                type="email"
                name="applicationEmail"
                value={formData.applicationEmail}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
          )}
        </section>

        <button 
          type="submit"
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Post Job
        </button>
      </form>
    </div>
  );
};

export default CreateJobPage;
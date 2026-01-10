import { useState } from 'react';

const SearchSection = ({ onSearch, onUploadResume, hasUploadedResume }) => {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [showResumeUpload, setShowResumeUpload] = useState(!hasUploadedResume);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ keyword, location });
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !resumeFile) {
      setError('Please fill in all fields');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (resumeFile.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('resume', resumeFile);

    try {
      setUploading(true);
      console.log('Sending FormData to onUploadResume:', formData);
      await onUploadResume(formData);
      alert('Resume uploaded successfully! We will notify you about suitable opportunities.');
      setShowResumeUpload(false);
    } catch (error) {
      console.error('Error uploading resume:', error);
      setError('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-50 pt-8 mt-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12 mt-10">
          Find your next role at the world's most cutting-edge companies
        </h1>

        {/* Job Search Form */}
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Job title, keywords, or company"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="flex-1">
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <button
            type="submit"
            className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Resume Upload Banner */}
        {showResumeUpload && (
          <div className="bg-white rounded-lg shadow-lg p-8 mt-4 mb-2 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">
              Upload your resume and get jobs delivered to your inbox
            </h2>
              <button
                type="button"
                onClick={() => {
                  setShowResumeUpload(false);
                  setEmail('');
                  setResumeFile(null);
                  setError(null);
                }}
                className="absolute top-2 right-2 bg-gray-200 rounded-lg px-2 py-1 hover:bg-gray-300 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleResumeSubmit} className="flex gap-4">
              <div className="flex-1">
                <label className="w-full cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="w-64 px-4 py-3 rounded-lg border border-gray-300 focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-900 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-900 transition-colors overflow-hidden">
                    {resumeFile ? (
                      <>
                        <svg className="w-5 h-5 mr-2 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="truncate text-gray-700">{resumeFile.name}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Upload Resume</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <button
                type="submit"
                className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Submit'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchSection;
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const JobDetailPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs/${id}`);
        if (!response.ok) throw new Error('Job not found');
        const data = await response.json();
        setJob(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
  if (!job) return <div className="text-center py-8">Job not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="border-b pb-8">
          <div className="flex justify-between items-start">
            <div className="flex gap-6">
              <img
                src={job.companyLogo || '/default-company-logo.png'}
                alt={`${job.company} logo`}
                className="w-16 h-16 object-contain rounded-lg"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                <p className="text-xl text-gray-600 mt-2">{job.company}</p>
              </div>
            </div>
            <button
              onClick={() => window.open(job.applicationUrl, '_blank')}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Apply Now
            </button>
          </div>

          <div className="mt-6 text-gray-600">
            <p className="text-lg">
              {job.company} is looking to hire a {job.title} to join their team.
              {job.locationType !== 'Remote' && ` This position is based in ${job.location}.`}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-8 py-8">
          {/* Job Details */}
          <div className="col-span-2">
            <div className="prose prose-base max-w-none prose-p:my-2 prose-headings:mb-3 prose-headings:mt-6 prose-ul:my-2 prose-li:my-1">
              <h2 className="text-2xl font-semibold mb-4">About the Role</h2>
              <ReactMarkdown className="text-gray-600">
                {job.description}
              </ReactMarkdown>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Details Card */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Job Details</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Location</h4>
                  <p className="mt-1">{job.location}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Job Type</h4>
                  <p className="mt-1">{job.positionType}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Salary</h4>
                  <p className="mt-1">
                    {job.salary ? `${job.salary}` : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Keywords */}
            {job.keywords && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {job.keywords.split(',').map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
                    >
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-8 mt-8">
          <div className="text-center">
            <button
              onClick={() => window.open(job.applicationUrl, '_blank')}
              className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg transition-colors"
            >
              Apply for this position
            </button>
            <p className="text-gray-500 mt-4">
              Please let {job.company} know you found this position on our job board.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
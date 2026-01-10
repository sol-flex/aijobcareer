import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import JobCard from '../components/JobCard';

const CompanyPage = () => {
  const { companyName } = useParams();
  const [jobs, setJobs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompanyJobs = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs/company/${encodeURIComponent(companyName)}`);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const data = await response.json();
        
        // Group jobs by category
        const groupedJobs = data.reduce((acc, job) => {
          if (!acc[job.primaryRole]) {
            acc[job.primaryRole] = [];
          }
          acc[job.primaryRole].push(job);
          return acc;
        }, {});
        
        setJobs(groupedJobs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyJobs();
  }, [companyName]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
  if (!jobs) return <div className="text-center py-8">No jobs found</div>;

  const companyLogo = jobs && Object.values(jobs)[0]?.[0]?.companyLogo;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto p-8">
        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center gap-6">
            <img
              src={companyLogo || '/default-company-logo.png'}
              alt={`${companyName} logo`}
              className="w-20 h-20 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
              <p className="text-gray-600 mt-2">
                {Object.values(jobs).flat().length} open positions
              </p>
            </div>
          </div>
        </div>

        {/* Job Categories */}
        <div className="space-y-8">
          {Object.entries(jobs).map(([category, categoryJobs]) => (
            <div key={category} className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {category}
              </h2>
              
              <div className="space-y-4">
                {categoryJobs.map(job => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyPage;
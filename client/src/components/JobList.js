import { useState, useEffect, useCallback } from 'react';
import JobCard from './JobCard';



const JobList = ({ searchParams }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const categoryParam = searchParams.category ? `?category=${searchParams.category}` : '';
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs${categoryParam}`);
      const data = await response.json();
      setJobs(data);

    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams.category]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filteredJobs = jobs.filter(job => {
    const matchesKeyword = job.title.toLowerCase().includes(searchParams.keyword.toLowerCase()) ||
      job.company.toLowerCase().includes(searchParams.keyword.toLowerCase());
    const matchesLocation = !searchParams.location || 
      job.locations.toLowerCase().includes(searchParams.location.toLowerCase());
    
    return matchesKeyword && matchesLocation;
  });


  if (loading) {
    return (
      <div className="text-center py-4">
        Loading jobs...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="mt-4 mb-4 text-gray-500">
        <span className="font-medium text-gray-600">{filteredJobs.length}</span> {filteredJobs.length === 1 ? 'job' : 'jobs'} found
      </div>
      <div>
        {filteredJobs.map((job, index) =>
          <JobCard
            key={job.id}
            job={job}
            className={index === 0 ? 'mt-4' : ''}
          />
        )}
      </div>
       {
        filteredJobs.length === 0 && (
          <div className="text-center py-4">
            No jobs found
          </div>
        )}

    </div>
  );
};

export default JobList;
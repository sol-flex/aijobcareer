import { useState, useEffect } from 'react';
import JobCard from './JobCard';



const JobList = ({ searchParams }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs`);
      const data = await response.json();
      setJobs(data);

    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesKeyword = job.title.toLowerCase().includes(searchParams.keyword.toLowerCase()) ||
                          job.company.toLowerCase().includes(searchParams.keyword.toLowerCase());
    
    return matchesKeyword;
  });


  if (loading) {
    return (
      <div className="text-center py-4">
        Loading jobs...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="space-y-4">
        {filteredJobs.map(job => 
          <JobCard key={job.id} job={job} />
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
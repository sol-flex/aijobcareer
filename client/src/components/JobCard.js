import { Link } from 'react-router-dom';
import { LuClock4 } from "react-icons/lu";


function timeAgo(dateString) {
  const now = new Date();
  const posted = new Date(dateString);
  const diffInSeconds = Math.floor((now - posted) / 1000);

  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffInSeconds < minute) return `${diffInSeconds}s`;
  if (diffInSeconds < hour) return `${Math.floor(diffInSeconds / minute)}m`;
  if (diffInSeconds < day) return `${Math.floor(diffInSeconds / hour)}h`;
  if (diffInSeconds < week) return `${Math.floor(diffInSeconds / day)}d`;
  return `${Math.floor(diffInSeconds / week)}w`;
}


const JobCard = ({ job }) => {
    return (
        <div className="bg-card rounded-lg shadow-sm hover:shadow-md hover:border-primary/50 transition-all p-6 border border-border mt-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex-shrink-0">
              <img
                src={job.companyLogo || '/default-company-logo.png'}
                alt={`${job.company} logo`}
                className="w-full h-full object-contain rounded"
              />
            </div>

            <div className="flex-1">
              <Link to={`/jobs/${job._id}`} className="block group">
                <h2 className="text-xl font-semibold text-foreground">{job.title}</h2>
              </Link>
              <Link to={`/companies/${job.company}`} className="block">
                <p className="text-muted-foreground mt-1">{job.company}</p>
              </Link>
              <div className="flex items-center gap-2 mt-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{job.locations}</span>
                {job.country && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span>{job.country}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-1 items-center text-gray-500">
              <LuClock4 /> {timeAgo(job.createdAt)} ago
            </div>
          </div>
        </div>
    );
  };
  
  export default JobCard;
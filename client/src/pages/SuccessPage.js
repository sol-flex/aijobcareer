import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const publishJob = async () => {
      try {
        const jobId = localStorage.getItem('pendingJobId');
        if (!jobId) {
          throw new Error('No pending job found');
        }

        const now = new Date();
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs/${jobId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            published: true,
            paymentStatus: 'paid',
            publishedAt: now,
            expiresAt: new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000))
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to publish job');
        }

        localStorage.removeItem('pendingJobId');

        // Redirect after 7 seconds
        setTimeout(() => {
          navigate('/');
        }, 7000);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    publishJob();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-gray-50 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/post-job')}
            className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          {loading ? 'Creating your job posting...' : 'Job Posted Successfully!'}
        </h1>
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              Your job has been published and is now live.
            </p>
            <p className="text-gray-500">
              Redirecting to homepage in a few seconds...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SuccessPage;
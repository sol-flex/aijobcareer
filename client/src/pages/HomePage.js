import SearchSection from '../components/SearchSection';
import JobList from '../components/JobList';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const HomePage = () => {
  const [urlSearchParams] = useSearchParams();
  const category = urlSearchParams.get('category');

  const [searchParams, setSearchParams] = useState({
    keyword: '',
    location: '',
    category: category || ''
  });

  // Update searchParams when URL category changes
  useEffect(() => {
    setSearchParams(prev => ({
      ...prev,
      category: category || ''
    }));
  }, [category]);
  const [hasUploadedResume, setHasUploadedResume] = useState(() => {
    // Check localStorage on initial load
    return localStorage.getItem('resumeUploaded') === 'true';
  });

  const handleSearch = (params) => {
    setSearchParams({ ...params, category: category || '' });
    console.log('Search params:', params);
  };

  const handleUploadResume = async (formData) => {
    try {
      // Log the raw FormData
      console.log('Raw FormData:', formData);
      
      // Convert FormData to object for logging
      const formDataObject = {};
      formData.forEach((value, key) => {
        formDataObject[key] = value;
      });
      console.log('FormData as object:', formDataObject);

      // Send the resume to the server
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/resumes`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload resume');
      }
      console.log('Server response:', data);

      // Set the resume upload state to true after successful upload
      setHasUploadedResume(true);
      // Store in localStorage to persist across sessions
      localStorage.setItem('resumeUploaded', 'true');
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SearchSection
        onSearch={handleSearch}
        onUploadResume={handleUploadResume}
        hasUploadedResume={hasUploadedResume}
      />
      <JobList searchParams={searchParams}/>
    </div>
  );
};

export default HomePage;
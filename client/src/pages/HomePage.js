import SearchSection from '../components/SearchSection';
import JobList from '../components/JobList';
import { useState } from 'react';

const HomePage = () => {
const [searchParams, setSearchParams] = useState({
  keyword: '',
  location: ''
});

  const handleSearch = (searchParams) => {

    setSearchParams(searchParams);
    console.log('Search params:', searchParams);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchSection onSearch={handleSearch} />
      <JobList searchParams={searchParams}/>
    </div>
  );
};

export default HomePage;
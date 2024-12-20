import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            AI Job Board
          </Link>
          
          <div className="flex space-x-6">
            <Link to="/" className="hover:text-blue-500 px-4 py-2">Browse Jobs</Link>
            <Link to="/post-job" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
              Post a Job
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
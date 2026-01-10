import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side - Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
              <div className="text-white font-bold text-lg">L</div>
            </div>
            <span className="text-xl font-medium text-foreground">Legend</span>
          </Link>

          {/* Right Side - Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Find Jobs
            </Link>
            <Link to="/post-job" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Post a Job
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
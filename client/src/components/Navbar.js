import { Link } from 'react-router-dom';
import legendLogo from '../legend-logo.png';

const Navbar = () => {
  return (
    <nav className="bg-primary shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <img src={legendLogo} alt="Legend - AI & Crypto Job Board" className="h-16 w-auto" />
          </Link>

          <div className="flex space-x-6">
            <Link to="/" className="hover:text-primary-foreground/80 py-2 text-primary-foreground font-bold transition-colors">Browse Jobs</Link>
            <Link to="/post-job" className="bg-accent text-accent-foreground px-4 py-2 rounded-lg hover:bg-accent/80 font-bold transition-colors">
              Post a Job
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
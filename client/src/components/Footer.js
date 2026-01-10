import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-black text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-4">Legend</h3>
            <p className="text-gray-400 text-sm">
              Find your next role at the world's most cutting-edge companies.
            </p>
          </div>

          {/* For Job Seekers */}
          <div>
            <h4 className="font-semibold mb-4">For Job Seekers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition">
                  Upload Resume
                </Link>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="font-semibold mb-4">For Employers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/post-job" className="text-gray-400 hover:text-white transition">
                  Post a Job
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Legend. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

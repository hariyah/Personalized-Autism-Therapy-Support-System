import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaHandsHoldingChild } from 'react-icons/fa6';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const isOnSubApp = location.pathname.startsWith('/autism-profile') || location.pathname.startsWith('/therapy-collab');
  const showNav = isAuthenticated || isOnSubApp;

  const isActive = (path: string) =>
    (path === '/autism-profile' || path === '/therapy-collab')
      ? location.pathname === path || location.pathname.startsWith(path + '/')
      : location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!showNav) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="text-xl font-semibold text-gray-900 hover:text-pastel-green-600 transition-colors flex items-center gap-4">
            <FaHandsHoldingChild className="text-pastel-green-600 text-4xl" />
            <span>Cognitive Activity Plan Generator</span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                isActive('/dashboard') 
                  ? 'text-pastel-green-600 bg-pastel-green-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/autism-care"
              className={`px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                isActive('/autism-care')
                  ? 'text-pastel-green-600 bg-pastel-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Autism Care
            </Link>
            <Link
              to="/autism-profile"
              className={`px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                isActive('/autism-profile')
                  ? 'text-pastel-green-600 bg-pastel-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Autism Profile
            </Link>
            <Link
              to="/therapy-collab"
              className={`px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                isActive('/therapy-collab')
                  ? 'text-pastel-green-600 bg-pastel-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Therapy Collaboration
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden md:block">Welcome, <span className="font-medium text-gray-900">{user?.username}</span></span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}


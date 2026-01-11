import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaHandsHoldingChild } from 'react-icons/fa6';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
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


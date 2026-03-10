import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './autism-profile/contexts/AuthContext';
import AutismProfileApp from './autism-profile/App';
import './autism-profile/index.css';

/**
 * Wrapper for the Autism Profile sub-app at /autism-profile.
 * Shares main app auth (reads auth_token/auth_user from localStorage).
 */
export default function AutismProfilePage() {
  return (
    <div className="autism-profile-app rojith-app min-h-screen">
      <AuthProvider>
        <AutismProfileApp />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: '12px',
              fontSize: '0.9rem',
            },
            success: { iconTheme: { primary: '#1c8296', secondary: 'white' } },
          }}
        />
      </AuthProvider>
    </div>
  );
}

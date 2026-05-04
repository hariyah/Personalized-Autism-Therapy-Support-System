import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import ProfileDetail from './pages/ProfileDetail';
import AutismCare from './pages/AutismCare';
import AutismProfilePage from './pages/AutismProfilePage';
import TherapyCollabPage from './pages/TherapyCollabPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

function MainContent() {
  const location = useLocation();
  const isAutismProfile = location.pathname.startsWith('/autism-profile');
  const isTherapyCollab = location.pathname.startsWith('/therapy-collab');
  return (
    <main className={(isAutismProfile || isTherapyCollab) ? 'min-h-screen' : ''}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <ProfileDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/autism-care"
          element={
            <ProtectedRoute>
              <AutismCare />
            </ProtectedRoute>
          }
        />
        <Route path="/autism-profile/*" element={<AutismProfilePage />} />
        <Route path="/therapy-collab/*" element={<TherapyCollabPage />} />
      </Routes>
    </main>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase();
  const target = userRole === 'doctor' ? '/therapy-collab/doctor/dashboard' : '/dashboard';
  return <Navigate to={target} replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <MainContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;


import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Notifications from './pages/Notifications';

// Parent Pages
import ParentDashboard from './pages/parent/Dashboard';
import MyChildren from './pages/parent/MyChildren';
import ChildProfile from './pages/parent/ChildProfile';
import ParentNewAnalysis from './pages/parent/NewAnalysis';
import TherapyRedirect from './pages/parent/TherapyRedirect';

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import PatientProfile from './pages/doctor/PatientProfile';
import DoctorPatients from './pages/doctor/Patients';
import DoctorAnalytics from './pages/doctor/Analytics';
import DoctorNewAnalysis from './pages/doctor/NewAnalysis';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Common Protected Routes */}
            <Route path="/notifications" element={
              <ProtectedRoute><Notifications /></ProtectedRoute>
            } />

            {/* Parent Routes */}
            <Route path="/parent/dashboard" element={
              <ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>
            } />
            <Route path="/parent/children" element={
              <ProtectedRoute allowedRoles={['parent']}><MyChildren /></ProtectedRoute>
            } />
            <Route path="/parent/children/:id" element={
              <ProtectedRoute allowedRoles={['parent']}><ChildProfile /></ProtectedRoute>
            } />
            <Route path="/parent/new-analysis" element={
              <ProtectedRoute allowedRoles={['parent']}><ParentNewAnalysis /></ProtectedRoute>
            } />
            <Route path="/parent/therapy/:id" element={
              <ProtectedRoute allowedRoles={['parent']}><TherapyRedirect /></ProtectedRoute>
            } />

            {/* Doctor Routes */}
            <Route path="/doctor/dashboard" element={
              <ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>
            } />
            <Route path="/doctor/patients" element={
              <ProtectedRoute allowedRoles={['doctor']}><DoctorPatients /></ProtectedRoute>
            } />
            <Route path="/doctor/patients/:id" element={
              <ProtectedRoute allowedRoles={['doctor']}><PatientProfile /></ProtectedRoute>
            } />
            <Route path="/doctor/analytics" element={
              <ProtectedRoute allowedRoles={['doctor']}><DoctorAnalytics /></ProtectedRoute>
            } />
            <Route path="/doctor/new-analysis" element={
              <ProtectedRoute allowedRoles={['doctor']}><DoctorNewAnalysis /></ProtectedRoute>
            } />
            <Route path="/doctor/new-analysis/:patientId" element={
              <ProtectedRoute allowedRoles={['doctor']}><DoctorNewAnalysis /></ProtectedRoute>
            } />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;

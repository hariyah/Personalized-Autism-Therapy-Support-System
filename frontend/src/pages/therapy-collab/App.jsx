import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import { BASE } from './routes';

import Notifications from './pages/Notifications';

import ParentDashboard from './pages/parent/Dashboard';
import MyChildren from './pages/parent/MyChildren';
import ChildProfile from './pages/parent/ChildProfile';
import ParentNewAnalysis from './pages/parent/NewAnalysis';
import Therapy from './pages/parent/Therapy';

import DoctorDashboard from './pages/doctor/Dashboard';
import PatientProfile from './pages/doctor/PatientProfile';
import DoctorPatients from './pages/doctor/Patients';
import DoctorAnalytics from './pages/doctor/Analytics';
import DoctorNewAnalysis from './pages/doctor/NewAnalysis';

export default function TherapyCollabApp() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <Routes>
                    <Route path="notifications" element={
                        <ProtectedRoute><Notifications /></ProtectedRoute>
                    } />

                    <Route path="parent/dashboard" element={
                        <ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>
                    } />
                    <Route path="parent/children" element={
                        <ProtectedRoute allowedRoles={['parent']}><MyChildren /></ProtectedRoute>
                    } />
                    <Route path="parent/children/:id" element={
                        <ProtectedRoute allowedRoles={['parent']}><ChildProfile /></ProtectedRoute>
                    } />
                    <Route path="parent/new-analysis" element={
                        <ProtectedRoute allowedRoles={['parent']}><ParentNewAnalysis /></ProtectedRoute>
                    } />
                    <Route path="parent/therapy/:id" element={
                        <ProtectedRoute allowedRoles={['parent']}><Therapy /></ProtectedRoute>
                    } />

                    <Route path="doctor/dashboard" element={
                        <ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>
                    } />
                    <Route path="doctor/patients" element={
                        <ProtectedRoute allowedRoles={['doctor']}><DoctorPatients /></ProtectedRoute>
                    } />
                    <Route path="doctor/patients/:id" element={
                        <ProtectedRoute allowedRoles={['doctor']}><PatientProfile /></ProtectedRoute>
                    } />
                    <Route path="doctor/analytics" element={
                        <ProtectedRoute allowedRoles={['doctor']}><DoctorAnalytics /></ProtectedRoute>
                    } />
                    <Route path="doctor/new-analysis" element={
                        <ProtectedRoute allowedRoles={['doctor']}><DoctorNewAnalysis /></ProtectedRoute>
                    } />
                    <Route path="doctor/new-analysis/:patientId" element={
                        <ProtectedRoute allowedRoles={['doctor']}><DoctorNewAnalysis /></ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to={`${BASE}/parent/dashboard`} replace />} />
                </Routes>
            </NotificationProvider>
        </AuthProvider>
    );
}

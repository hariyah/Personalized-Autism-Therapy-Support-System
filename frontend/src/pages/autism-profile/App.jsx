// Mounted under main app at /autism-profile — uses main app's auth (no separate login)
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { BASE } from "./routes";
import Dashboard    from "./pages/Dashboard";
import PatientProfile from "./pages/PatientProfile";
import NewAssessment  from "./pages/NewAssessment";
import Layout       from "./components/Layout";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
      <div className="spinner" style={{ borderTopColor:"var(--primary)", borderColor:"var(--teal-200)" }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to={`${BASE}/dashboard`} replace />} />
        <Route path="dashboard"                         element={<Dashboard />} />
        <Route path="patients/:patientId"               element={<PatientProfile />} />
        <Route path="patients/:patientId/assessment"    element={<NewAssessment />} />
      </Route>
      <Route path="*" element={<Navigate to={`${BASE}/dashboard`} replace />} />
    </Routes>
  );
}

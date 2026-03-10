// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BASE } from "../routes";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import {
  Plus, Users, Activity, ChevronRight, Baby, Calendar, AlertCircle
} from "lucide-react";
import PatientCard from "../components/PatientCard";
import AddPatientModal from "../components/AddPatientModal";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [user]);

  async function fetchPatients() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getPatients(user.uid);
      setPatients(data);
    } catch (err) {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  }

  function handlePatientAdded(newPatient) {
    setPatients(p => [newPatient, ...p]);
    setShowModal(false);
    toast.success("Patient profile created!");
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="dashboard page-container">
      {/* Header */}
      <div className="dashboard-header fade-up">
        <div>
          <p className="dashboard-greeting">{greeting},</p>
          <h1 className="dashboard-title">{profile?.fullName || "Guardian"}</h1>
          <p className="dashboard-sub">Manage your patients and autism severity assessments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Patient
        </button>
      </div>

      {/* Stats Row */}
      <div className="stats-row fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--teal-100)", color: "var(--teal-600)" }}>
            <Users size={20} />
          </div>
          <div>
            <div className="stat-value">{patients.length}</div>
            <div className="stat-label">Patients</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--amber-100)", color: "#92400e" }}>
            <Activity size={20} />
          </div>
          <div>
            <div className="stat-value">DSM-5</div>
            <div className="stat-label">Classifier Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--green-100)", color: "#166534" }}>
            <Baby size={20} />
          </div>
          <div>
            <div className="stat-value">AI</div>
            <div className="stat-label">OCR + NLP Ready</div>
          </div>
        </div>
      </div>

      {/* Patients Section */}
      <div className="section-header fade-up" style={{ animationDelay: "0.15s" }}>
        <h2>Patient Profiles</h2>
        <span className="patients-count">{patients.length} {patients.length === 1 ? "patient" : "patients"}</span>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ borderTopColor: "var(--primary)", borderColor: "var(--teal-200)", width: 32, height: 32 }} />
        </div>
      ) : patients.length === 0 ? (
        <div className="empty-state fade-up">
          <div className="empty-icon"><Users size={36} /></div>
          <h3>No patients yet</h3>
          <p>Create a patient profile to start running DSM-5 severity assessments.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add First Patient
          </button>
        </div>
      ) : (
        <div className="patients-grid fade-up" style={{ animationDelay: "0.2s" }}>
          {patients.map(p => (
            <PatientCard
              key={p.patient_id}
              patient={p}
              onClick={() => navigate(`${BASE}/patients/${p.patient_id}`)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddPatientModal
          guardianId={user.uid}
          onClose={() => setShowModal(false)}
          onAdded={handlePatientAdded}
        />
      )}
    </div>
  );
}

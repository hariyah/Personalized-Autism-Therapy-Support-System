// src/pages/PatientProfile.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BASE } from "../routes";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import { ArrowLeft, Activity, Brain, Plus, Calendar, Clock } from "lucide-react";
import SeverityBadge from "../components/SeverityBadge";
import RadarChartPanel from "../components/RadarChartPanel";
import SeverityMeter from "../components/SeverityMeter";
import "./PatientProfile.css";

const SEX_LABEL = { 1: "Male", 0: "Female" };

function getAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000*60*60*24*365.25));
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" });
}

export default function PatientProfile() {
  const { patientId }    = useParams();
  const { user }         = useAuth();
  const navigate         = useNavigate();

  const [patient, setPatient]         = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [selected, setSelected]       = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!user || !patientId) return;
    loadData();
  }, [user, patientId]);

  async function loadData() {
    setLoading(true);
    try {
      // Load patient info
      const patients = await api.getPatients(user.uid);
      const p = patients.find(x => x.patient_id === patientId);
      setPatient(p || null);

      // Load assessments
      const list = await api.getAssessments(user.uid, patientId);
      setAssessments(list);
      if (list.length > 0) setSelected(list[0]);
    } catch (err) {
      toast.error("Failed to load patient data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
        <div className="spinner" style={{ width:36, height:36, borderTopColor:"var(--primary)", borderColor:"var(--teal-100)" }} />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-container">
        <p style={{ color:"var(--text-muted)" }}>Patient not found.</p>
      </div>
    );
  }

  const age = getAge(patient.dob);

  return (
    <div className="patient-profile page-container">
      {/* Back */}
      <button className="back-btn fade-up" onClick={() => navigate(`${BASE}/dashboard`)}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Patient Header */}
      <div className="profile-header card fade-up" style={{ animationDelay:"0.05s" }}>
        <div className="profile-avatar">
          {patient.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{patient.name}</h1>
          <div className="profile-meta">
            {age !== null && <span>{age} years old</span>}
            {patient.dob && <span>· DOB: {formatDate(patient.dob)}</span>}
            {patient.sex !== undefined && <span>· {SEX_LABEL[patient.sex]}</span>}
          </div>
          {patient.diagnosis && (
            <div className="profile-diagnosis">{patient.diagnosis}</div>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate(`${BASE}/patients/${patientId}/assessment`)}
        >
          <Plus size={16} /> New Assessment
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="no-assessments card fade-up">
          <Brain size={40} />
          <h3>No assessments yet</h3>
          <p>Run the first AI-powered DSM-5 severity assessment for {patient.name}.</p>
          <button className="btn btn-primary" onClick={() => navigate(`${BASE}/patients/${patientId}/assessment`)}>
            <Plus size={16} /> Start Assessment
          </button>
        </div>
      ) : (
        <div className="profile-body">
          {/* Left: Assessment list */}
          <div className="assessment-list fade-up" style={{ animationDelay:"0.1s" }}>
            <h2>Assessment History</h2>
            {assessments.map((a, i) => (
              <div
                key={a.assessment_id}
                className={`assessment-item ${selected?.assessment_id === a.assessment_id ? "active" : ""}`}
                onClick={() => setSelected(a)}
              >
                <div className="assessment-item-top">
                  <SeverityBadge level={a.severity_level} />
                  <span className="assessment-date">{formatDate(a.timestamp)}</span>
                </div>
                <div className="assessment-item-label">{a.severity_label}</div>
                <div className="assessment-tss">
                  TSS: <strong>{a.domain_scores?.total_severity_score}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Assessment detail */}
          {selected && (
            <div className="assessment-detail fade-in">
              {/* Severity Meter */}
              <div className="detail-card card">
                <h3>DSM-5 Severity Classification</h3>
                <SeverityMeter level={selected.severity_level} label={selected.severity_label} />
                <div className="domain-scores">
                  <div className="domain-score-item">
                    <span>Social Communication Score</span>
                    <strong>{selected.domain_scores?.social_communication_score} / {selected.domain_scores?.max_social}</strong>
                  </div>
                  <div className="domain-score-item">
                    <span>Restricted Behavior Score</span>
                    <strong>{selected.domain_scores?.restricted_behavior_score} / {selected.domain_scores?.max_restricted}</strong>
                  </div>
                  <div className="domain-score-item total">
                    <span>Total Severity Score (TSS)</span>
                    <strong>{selected.domain_scores?.total_severity_score}</strong>
                  </div>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="detail-card card">
                <h3>Behavioral Profile Radar</h3>
                <p className="detail-card-sub">A1–A10 symptom indicators across DSM-5 domains</p>
                <RadarChartPanel radarData={selected.radar_data} />
              </div>

              {/* A Score Table */}
              <div className="detail-card card">
                <h3>A1–A10 Indicator Breakdown</h3>
                <div className="a-score-table">
                  {selected.radar_data?.map(item => (
                    <div key={item.indicator} className="a-score-row">
                      <div className="a-score-key">{item.indicator}</div>
                      <div className="a-score-question">{item.label}</div>
                      <div className="a-score-domain">{item.domain}</div>
                      <div className={`a-score-value ${item.value ? "present" : "absent"}`}>
                        {item.value ? "Present" : "Absent"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes for caregiver */}
              <div className="detail-card card caregiver-notes">
                <h3>Caregiver Insights</h3>
                {selected.severity_level === 1 && (
                  <p>Your child shows <strong>mild autism traits</strong> and may require some support in social situations. Encourage communication through play and structured social interactions.</p>
                )}
                {selected.severity_level === 2 && (
                  <p>Your child shows <strong>moderate autism traits</strong> requiring <strong>substantial support</strong>. Consistent routines, visual schedules, and ABA therapy may be beneficial.</p>
                )}
                {selected.severity_level === 3 && (
                  <p>Your child shows <strong>significant autism traits</strong> requiring <strong>very substantial support</strong>. Close coordination with therapists and specialized educational settings is strongly recommended.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

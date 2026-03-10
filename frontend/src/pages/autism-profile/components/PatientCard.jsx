// src/components/PatientCard.jsx
import { ChevronRight, User, Calendar } from "lucide-react";
import "./PatientCard.css";

const SEX_LABEL = { 1: "Male", 0: "Female" };

function getAge(dob) {
  if (!dob) return null;
  const ms = Date.now() - new Date(dob).getTime();
  const years = Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
  return years;
}

export default function PatientCard({ patient, onClick }) {
  const age = getAge(patient.dob);

  return (
    <div className="patient-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}>
      <div className="patient-card-avatar">
        {patient.name?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="patient-card-info">
        <div className="patient-card-name">{patient.name}</div>
        <div className="patient-card-meta">
          {age !== null && <span>{age} years old</span>}
          {patient.sex !== undefined && <span>· {SEX_LABEL[patient.sex]}</span>}
        </div>
        {patient.diagnosis && (
          <div className="patient-card-note">{patient.diagnosis}</div>
        )}
      </div>
      <ChevronRight size={18} className="patient-card-arrow" />
    </div>
  );
}

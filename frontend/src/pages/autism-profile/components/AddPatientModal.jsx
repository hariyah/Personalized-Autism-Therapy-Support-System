// src/components/AddPatientModal.jsx
import { useState } from "react";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import { X, User, Calendar, VenetianMask, FileText } from "lucide-react";
import "./Modal.css";

export default function AddPatientModal({ guardianId, onClose, onAdded }) {
  const [form, setForm] = useState({ name: "", dob: "", sex: "1", diagnosis: "", notes: "" });
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.createPatient({
        guardian_id: guardianId,
        name: form.name,
        dob: form.dob,
        sex: parseInt(form.sex),
        diagnosis: form.diagnosis,
        notes: form.notes
      });
      onAdded(result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-up">
        <div className="modal-header">
          <h3>Add Patient Profile</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Child's Full Name *</label>
            <div className="input-icon-wrap">
              <User size={15} className="input-icon" />
              <input type="text" className="form-input with-icon" placeholder="e.g. Alex Johnson"
                value={form.name} onChange={set("name")} required />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Date of Birth</label>
              <div className="input-icon-wrap">
                <Calendar size={15} className="input-icon" />
                <input type="date" className="form-input with-icon"
                  value={form.dob} onChange={set("dob")} />
              </div>
            </div>
            <div className="form-group">
              <label>Sex</label>
              <select className="form-input" value={form.sex} onChange={set("sex")}>
                <option value="1">Male</option>
                <option value="0">Female</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Current Diagnosis (optional)</label>
            <div className="input-icon-wrap">
              <VenetianMask size={15} className="input-icon" />
              <input type="text" className="form-input with-icon" placeholder="e.g. ASD, ADHD, suspected autism"
                value={form.diagnosis} onChange={set("diagnosis")} />
            </div>
          </div>

          <div className="form-group">
            <label>Notes for therapist (optional)</label>
            <textarea className="form-input" rows={3} placeholder="Any additional context..."
              value={form.notes} onChange={set("notes")}
              style={{ resize: "vertical", minHeight: 80 }} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" />Creating…</> : "Create Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// src/pages/NewAssessment.jsx
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BASE } from "../routes";
import { api } from "../utils/api";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  Upload, FileImage, Brain, CheckCircle, AlertCircle,
  ChevronRight, ChevronLeft, Sparkles, RotateCcw, ArrowLeft
} from "lucide-react";
import SeverityMeter from "../components/SeverityMeter";
import RadarChartPanel from "../components/RadarChartPanel";
import "./NewAssessment.css";

const QUESTIONS = {
  A1: { label: "A1 – Communication", question: "Does your child speak very little, use echolalia, or give unrelated answers?", domain: "Social Communication" },
  A2: { label: "A2 – Eye Contact",   question: "Does your child avoid eye contact or not respond when their name is called?",    domain: "Social Communication" },
  A3: { label: "A3 – Pretend Play",  question: "Does your child not engage in pretend or imaginative play?",                    domain: "Social Communication" },
  A4: { label: "A4 – Emotions",      question: "Does your child struggle to understand others' feelings or emotions?",          domain: "Social Communication" },
  A5: { label: "A5 – Routine",       question: "Is your child easily upset by small changes in routine or environment?",        domain: "Restricted & Repetitive Behavior" },
  A6: { label: "A6 – Interests",     question: "Does your child have unusually intense or obsessive, repetitive interests?",    domain: "Restricted & Repetitive Behavior" },
  A7: { label: "A7 – Sensory",       question: "Is your child over- or under-sensitive to sounds, smells, textures, or light?", domain: "Restricted & Repetitive Behavior" },
  A8: { label: "A8 – Social",        question: "Does your child struggle to socialize or show little interest in peers?",       domain: "Social Communication" },
  A9: { label: "A9 – Touch",         question: "Does your child avoid or dislike physical contact?",                            domain: "Social Communication" },
  A10:{ label: "A10 – Safety",       question: "Does your child show little awareness of dangerous situations?",                domain: "Restricted & Repetitive Behavior" }
};

const STEPS = ["Upload Report", "Review & Complete", "Result"];

function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getAge(dob) {
  if (!dob) return 7;
  return Math.max(1, Math.floor((Date.now() - new Date(dob).getTime()) / (1000*60*60*24*365.25)));
}

export default function NewAssessment() {
  const { patientId } = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();

  const [step, setStep] = useState(0);

  // Step 0 state
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Step 1 state — A scores + patient info
  const [aScores, setAScores] = useState(
    Object.fromEntries(Object.keys(QUESTIONS).map(k => [k, null]))
  );
  const [ocrText, setOcrText]     = useState("");
  const [sections, setSections]   = useState({});
  const [age, setAge]             = useState(7);
  const [sex, setSex]             = useState(1);
  const [patientName, setPatientName] = useState("");

  // Step 2 state
  const [result, setResult]       = useState(null);
  const [predicting, setPredicting] = useState(false);

  // ── Dropzone ──────────────────────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png"] },
    maxFiles: 1
  });

  // ── Step 0 → OCR ─────────────────────────────────────────────────────────
  async function handleOCR() {
    if (!file) { toast.error("Please upload a therapy report image first"); return; }
    setOcrLoading(true);
    try {
      const b64 = await imageToBase64(file);
      const res = await api.ocr(b64);
      setOcrText(res.raw_text || "");
      setSections(res.sections || {});
      // Merge inferred scores — null means not found
      setAScores(prev => {
        const merged = { ...prev };
        for (const k of Object.keys(QUESTIONS)) {
          if (res.a_scores?.[k] !== undefined) merged[k] = res.a_scores[k];
        }
        return merged;
      });
      toast.success("OCR complete! Review and fill in missing values.");
      setStep(1);
    } catch (err) {
      toast.error("OCR failed: " + err.message);
    } finally {
      setOcrLoading(false);
    }
  }

  // ── Skip OCR — manual entry ───────────────────────────────────────────────
  function skipToManual() {
    setStep(1);
  }

  // ── Step 1 → Predict ─────────────────────────────────────────────────────
  async function handlePredict() {
    const missing = Object.keys(QUESTIONS).filter(k => aScores[k] === null);
    if (missing.length > 0) {
      toast.error(`Please answer all questions (${missing.join(", ")} are missing)`);
      return;
    }
    setPredicting(true);
    try {
      const res = await api.predict({
        a_scores:    aScores,
        age:         age,
        sex:         sex,
        patient_id:  patientId,
        guardian_id: user.uid
      });
      setResult(res);
      setStep(2);
    } catch (err) {
      toast.error("Prediction failed: " + err.message);
    } finally {
      setPredicting(false);
    }
  }

  // ── Inferred count ────────────────────────────────────────────────────────
  const autoFilled = Object.values(aScores).filter(v => v !== null).length;
  const pending    = Object.keys(QUESTIONS).filter(k => aScores[k] === null);

  return (
    <div className="new-assessment page-container">
      <button className="back-btn fade-up" onClick={() => navigate(`${BASE}/patients/${patientId}`)}>
        <ArrowLeft size={16} /> Back to Patient
      </button>

      {/* Progress Steps */}
      <div className="steps-bar fade-up">
        {STEPS.map((s, i) => (
          <div key={s} className={`step-item ${i === step ? "active" : i < step ? "done" : ""}`}>
            <div className="step-dot">
              {i < step ? <CheckCircle size={16} /> : <span>{i + 1}</span>}
            </div>
            <span className="step-label">{s}</span>
            {i < STEPS.length - 1 && <div className="step-line" />}
          </div>
        ))}
      </div>

      {/* ── STEP 0: Upload ──────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="step-panel fade-up">
          <div className="step-heading">
            <h2>Upload Therapy Report</h2>
            <p>Upload a photo or scan of the therapy report. Our AI will extract behavioral observations automatically.</p>
          </div>

          <div {...getRootProps()} className={`dropzone ${isDragActive ? "drag-active" : ""} ${file ? "has-file" : ""}`}>
            <input {...getInputProps()} />
            {file ? (
              <div className="dropzone-preview">
                <img src={preview} alt="Report preview" />
                <div className="dropzone-file-info">
                  <FileImage size={18} />
                  <span>{file.name}</span>
                  <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}>
                    <RotateCcw size={14} /> Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="dropzone-placeholder">
                <div className="dropzone-icon"><Upload size={28} /></div>
                <div className="dropzone-text">
                  <strong>Drop your therapy report here</strong>
                  <span>or click to browse — JPG, JPEG, PNG accepted</span>
                </div>
              </div>
            )}
          </div>

          <div className="step-actions">
            <button className="btn btn-outline" onClick={skipToManual}>
              Skip — Enter manually
            </button>
            <button className="btn btn-primary" onClick={handleOCR} disabled={!file || ocrLoading}>
              {ocrLoading
                ? <><span className="spinner" />Analyzing report…</>
                : <><Sparkles size={16} /> Extract with AI</>
              }
            </button>
          </div>

          {ocrLoading && (
            <div className="ocr-progress">
              <div className="ocr-step">🔍 Running OCR on image…</div>
              <div className="ocr-step">🧠 Extracting behavioral keywords…</div>
              <div className="ocr-step">📋 Mapping to A1–A10 indicators…</div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 1: Review & Complete ───────────────────────────────────────── */}
      {step === 1 && (
        <div className="step-panel fade-up">
          <div className="step-heading">
            <h2>Review & Complete Assessment</h2>
            <p>
              {autoFilled > 0
                ? `AI auto-filled ${autoFilled} of 10 questions from the therapy report. Please review and answer the remaining ${pending.length}.`
                : "Please answer all 10 behavioral questions for accurate DSM-5 classification."
              }
            </p>
          </div>

          {/* Patient Info */}
          <div className="patient-info-row card">
            <h3>Patient Information</h3>
            <div className="patient-info-grid">
              <div className="form-group">
                <label>Age (years)</label>
                <input type="number" className="form-input" min={1} max={80}
                  value={age} onChange={e => setAge(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Sex</label>
                <select className="form-input" value={sex} onChange={e => setSex(Number(e.target.value))}>
                  <option value={1}>Male</option>
                  <option value={0}>Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* OCR Summary (if available) */}
          {ocrText && (
            <details className="ocr-summary">
              <summary>
                <span>View OCR extracted text ({ocrText.length} characters)</span>
              </summary>
              <pre className="ocr-text-box">{ocrText}</pre>
            </details>
          )}

          {/* A1–A10 Questions */}
          <div className="questions-list">
            {Object.entries(QUESTIONS).map(([key, info]) => {
              const val = aScores[key];
              const isAuto = val !== null && ocrText; // was auto-filled
              return (
                <div key={key} className={`question-card card ${val === null ? "unanswered" : val === 1 ? "yes" : "no"}`}>
                  <div className="question-header">
                    <span className="question-key">{info.label}</span>
                    <span className="question-domain">{info.domain}</span>
                    {isAuto && val !== null && (
                      <span className="auto-tag"><Sparkles size={11} /> Auto-detected</span>
                    )}
                  </div>
                  <p className="question-text">{info.question}</p>
                  <div className="question-options">
                    <button
                      className={`q-btn q-yes ${val === 1 ? "selected" : ""}`}
                      onClick={() => setAScores(p => ({ ...p, [key]: 1 }))}
                    >
                      Yes — Present
                    </button>
                    <button
                      className={`q-btn q-no ${val === 0 ? "selected" : ""}`}
                      onClick={() => setAScores(p => ({ ...p, [key]: 0 }))}
                    >
                      No — Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pending.length > 0 && (
            <div className="pending-warning">
              <AlertCircle size={16} />
              {pending.length} question{pending.length > 1 ? "s" : ""} still need{pending.length === 1 ? "s" : ""} your answer: {pending.join(", ")}
            </div>
          )}

          <div className="step-actions">
            <button className="btn btn-outline" onClick={() => setStep(0)}>
              <ChevronLeft size={16} /> Back
            </button>
            <button className="btn btn-primary" onClick={handlePredict} disabled={predicting}>
              {predicting
                ? <><span className="spinner" />Classifying…</>
                : <><Brain size={16} /> Classify Severity</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Result ──────────────────────────────────────────────────── */}
      {step === 2 && result && (
        <div className="step-panel fade-up">
          <div className="step-heading">
            <div className="result-icon">✅</div>
            <h2>Classification Complete</h2>
            <p>DSM-5 severity level has been determined and saved to the patient profile.</p>
          </div>

          <div className="result-grid">
            <div className="card result-card">
              <h3>DSM-5 Severity Level</h3>
              <SeverityMeter level={result.severity_level} label={result.severity_label} />
              <div className="domain-scores" style={{ marginTop: 20 }}>
                <div className="domain-score-item">
                  <span>Social Communication Score</span>
                  <strong>{result.domain_scores?.social_communication_score} / {result.domain_scores?.max_social}</strong>
                </div>
                <div className="domain-score-item">
                  <span>Restricted Behavior Score</span>
                  <strong>{result.domain_scores?.restricted_behavior_score} / {result.domain_scores?.max_restricted}</strong>
                </div>
                <div className="domain-score-item total">
                  <span>Total Severity Score (TSS)</span>
                  <strong>{result.domain_scores?.total_severity_score}</strong>
                </div>
              </div>
            </div>

            <div className="card result-card">
              <h3>Behavioral Profile</h3>
              <p style={{ fontSize:"0.83rem", color:"var(--text-muted)", marginBottom:8 }}>
                Radar visualization of A1–A10 indicators
              </p>
              <RadarChartPanel radarData={result.radar_data} />
            </div>
          </div>

          <div className="step-actions" style={{ marginTop: 28 }}>
            <button className="btn btn-outline" onClick={() => navigate(`${BASE}/patients/${patientId}`)}>
              View Full Profile
            </button>
            <button className="btn btn-primary" onClick={() => {
              setStep(0); setFile(null); setPreview(null); setOcrText(""); setSections({});
              setAScores(Object.fromEntries(Object.keys(QUESTIONS).map(k => [k, null])));
              setResult(null);
            }}>
              New Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

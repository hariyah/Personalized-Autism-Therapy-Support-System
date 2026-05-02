// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BASE } from "../routes";
import toast from "react-hot-toast";
import { Brain, Mail, Lock, Eye, EyeOff } from "lucide-react";
import "./Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]     = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(`${BASE}/dashboard`);
    } catch (err) {
      toast.error(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo">
            <Brain size={32} />
          </div>
          <h1 className="auth-headline">AutismSense</h1>
          <p className="auth-tagline">
            AI-powered autism severity classification and personalized profiling for caregivers and therapists.
          </p>
          <div className="auth-features">
            {[
              "DSM-5 Level Classification",
              "Therapy Report OCR Analysis",
              "Visual Autism Profile Radar Chart",
              "Personalized Caregiver Insights"
            ].map(f => (
              <div key={f} className="auth-feature-item">
                <span className="auth-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="auth-left-decoration" />
      </div>

      <div className="auth-right">
        <div className="auth-card fade-up">
          <div className="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your guardian account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email address</label>
              <div className="input-icon-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  className="form-input with-icon"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPw ? "text" : "password"}
                  className="form-input with-icon with-icon-right"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button type="button" className="input-icon-right" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <><span className="spinner" />Signing in…</> : "Sign In"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to={`${BASE}/register`}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

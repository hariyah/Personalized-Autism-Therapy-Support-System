// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BASE } from "../routes";
import toast from "react-hot-toast";
import { Brain, Mail, Lock, User, Phone, Heart, Eye, EyeOff } from "lucide-react";
import "./Auth.css";

const RELATIONSHIPS = ["Parent", "Legal Guardian", "Grandparent", "Sibling", "Therapist", "Other"];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", relationship: "Parent", password: "", confirm: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created!");
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
          <div className="auth-logo"><Brain size={32} /></div>
          <h1 className="auth-headline">AutismSense</h1>
          <p className="auth-tagline">
            Create your guardian account to start managing autism severity assessments for your child.
          </p>
          <div className="auth-features">
            {[
              "Secure guardian profiles",
              "Multi-patient management",
              "Longitudinal tracking",
              "Shareable reports for therapists"
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
        <div className="auth-card fade-up" style={{ maxWidth: 460 }}>
          <div className="auth-card-header">
            <h2>Create account</h2>
            <p>Join as a guardian or caregiver</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row-2">
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-icon-wrap">
                  <User size={16} className="input-icon" />
                  <input type="text" className="form-input with-icon" placeholder="Jane Doe"
                    value={form.fullName} onChange={set("fullName")} required />
                </div>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <div className="input-icon-wrap">
                  <Phone size={16} className="input-icon" />
                  <input type="tel" className="form-input with-icon" placeholder="+1 234 567 8900"
                    value={form.phone} onChange={set("phone")} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Email address</label>
              <div className="input-icon-wrap">
                <Mail size={16} className="input-icon" />
                <input type="email" className="form-input with-icon" placeholder="you@example.com"
                  value={form.email} onChange={set("email")} required />
              </div>
            </div>

            <div className="form-group">
              <label>Relationship to child</label>
              <div className="input-icon-wrap">
                <Heart size={16} className="input-icon" />
                <select className="form-input with-icon" value={form.relationship} onChange={set("relationship")}>
                  {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Password</label>
                <div className="input-icon-wrap">
                  <Lock size={16} className="input-icon" />
                  <input type={showPw ? "text" : "password"} className="form-input with-icon"
                    placeholder="Min. 6 chars"
                    value={form.password} onChange={set("password")} required />
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-icon-wrap">
                  <Lock size={16} className="input-icon" />
                  <input type={showPw ? "text" : "password"} className="form-input with-icon"
                    placeholder="Repeat password"
                    value={form.confirm} onChange={set("confirm")} required />
                </div>
              </div>
            </div>

            <label className="show-pw-toggle">
              <input type="checkbox" checked={showPw} onChange={() => setShowPw(!showPw)} />
              Show passwords
            </label>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <><span className="spinner" />Creating account…</> : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to={`${BASE}/login`}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

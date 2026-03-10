// src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BASE } from "../routes";
import toast from "react-hot-toast";
import {
  LayoutDashboard, LogOut, Brain, User, ChevronRight, HeartHandshake
} from "lucide-react";
import "./Layout.css";

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><Brain size={22} /></div>
          <div>
            <div className="brand-name">AutismSense</div>
            <div className="brand-sub">DSM-5 Classifier</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to={`${BASE}/dashboard`} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {(profile?.fullName || user?.email || "?")[0].toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{profile?.fullName || "Guardian"}</div>
              <div className="user-role">{profile?.relationship || "Caregiver"}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

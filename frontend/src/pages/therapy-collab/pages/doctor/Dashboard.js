import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import therapyApi from '../../utils/therapyApi';
import { BASE } from '../../routes';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import { FiUsers, FiAlertCircle, FiClock, FiChevronRight, FiTrendingUp, FiActivity, FiZap } from 'react-icons/fi';

const DoctorDashboard = () => {
    const [patients, setPatients] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        try {
            const [patientsRes, statsRes] = await Promise.all([
                therapyApi.get('/api/doctor/patients'),
                therapyApi.get('/api/doctor/dashboard/stats')
            ]);
            setPatients(patientsRes.data.patients || []);
            setStats(statsRes.data.stats || {});
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    if (loading) return (
        <div className="flex min-h-screen bg-app"><Sidebar />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            </div>
        </div>
    );

    const statCards = [
        { label: 'Active Patients', value: stats?.totalPatients || 0, icon: FiUsers, color: 'violet', sub: '+12% this month' },
        { label: 'Pending Review', value: stats?.pendingReviews || 0, icon: FiClock, color: 'teal', sub: 'Awaiting action' },
        { label: 'Critical Alerts', value: stats?.highUrgency || 0, icon: FiAlertCircle, color: 'rose', sub: 'Immediate focus' },
    ];

    const colorMap = {
        violet: { grad: 'from-violet-500/20 to-violet-500/5 border-violet-500/20', text: 'text-violet-400' },
        teal: { grad: 'from-teal-500/20   to-teal-500/5   border-teal-500/20', text: 'text-teal-400' },
        rose: { grad: 'from-rose-500/20   to-rose-500/5   border-rose-500/20', text: 'text-rose-400' },
    };

    const getSeverityBadge = (s) => {
        if (s === 'severe') return 'badge-high';
        if (s === 'moderate') return 'badge-medium';
        return 'badge-low';
    };

    return (
        <div className="flex min-h-screen bg-app">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8 page-enter">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <p className="text-xs font-bold text-teal-400 uppercase tracking-[0.3em] mb-2">Clinical Workspace</p>
                            <h1 className="text-4xl font-black text-slate-100 tracking-tight">
                                <span className="gradient-text">Doctor</span> Dashboard
                            </h1>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="glow-dot" />
                                <p className="text-slate-500 text-sm font-medium">Monitoring {stats?.totalPatients || 0} active cases</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <div className="h-8 w-px bg-white/[0.06]" />
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-300">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {statCards.map(({ label, value, icon: Icon, color, sub }) => (
                            <div key={label} className={`card border bg-gradient-to-br ${colorMap[color].grad} p-6 card-glow`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-10 h-10 ${colorMap[color].grad.split(' ')[0]} border ${colorMap[color].grad.split(' ')[2]} rounded-xl flex items-center justify-center`}>
                                        <Icon className={colorMap[color].text} size={18} />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{sub}</span>
                                </div>
                                <p className="text-3xl font-black text-slate-100 mb-1">{value}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Patients List */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-black text-slate-200">Active Assignments</h2>
                                <Link to={`${BASE}/doctor/patients`} className="text-xs font-bold text-violet-400 hover:text-violet-300 uppercase tracking-widest transition-colors">
                                    View All →
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {patients.length === 0 ? (
                                    <div className="card border-subtle p-16 text-center">
                                        <FiUsers className="text-slate-700 mx-auto mb-4" size={32} />
                                        <h3 className="text-slate-400 font-bold">No Patients Assigned</h3>
                                        <p className="text-slate-600 text-xs mt-1">Waiting for patients to be connected.</p>
                                    </div>
                                ) : (
                                    patients.slice(0, 5).map(p => (
                                        <Link to={`${BASE}/doctor/patients/${p._id}`} key={p._id} className="card border-subtle p-4 flex items-center justify-between hover:border-violet-500/20 hover:bg-white/[0.02] transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform shadow-md shadow-violet-500/20">
                                                    {p.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-200 text-sm group-hover:text-violet-300 transition-colors">{p.name}</p>
                                                    <p className="text-xs text-slate-600">Parent: {p.parent?.name || 'Unknown'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={getSeverityBadge(p.diagnosisDetails?.severity)}>
                                                    {p.diagnosisDetails?.severity || 'stable'}
                                                </span>
                                                <FiChevronRight className="text-slate-700 group-hover:text-violet-400 transition-colors" size={16} />
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Panel */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-black text-slate-200">Quick Insights</h2>

                            {/* Growth Card */}
                            <div className="card border-subtle overflow-hidden">
                                <div className="gradient-primary p-5 relative overflow-hidden">
                                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                                    <FiTrendingUp className="text-white/70 mb-3 relative z-10" size={20} />
                                    <h3 className="font-black text-white mb-1 relative z-10">Practice Growth</h3>
                                    <p className="text-white/60 text-xs leading-relaxed relative z-10">
                                        Patient care volume up <span className="text-white font-bold">18%</span> this month.
                                    </p>
                                    <Link to={`${BASE}/doctor/analytics`} className="mt-4 inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-white/25 transition-all relative z-10 border border-white/20">
                                        <FiActivity size={12} /> Analyze Data
                                    </Link>
                                </div>
                            </div>

                            {/* Alerts */}
                            <div className="card border-subtle p-4">
                                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                    <FiAlertCircle className="text-rose-400" size={15} /> System Alerts
                                </h3>
                                {stats?.highUrgency > 0 ? (
                                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-1">HIGH URGENCY</p>
                                        <p className="text-xs text-slate-400">
                                            New analysis for <span className="text-slate-200 font-bold">{patients[0]?.name || 'Patient'}</span> shows behavioral spikes.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <FiZap className="text-slate-700 mx-auto mb-2" size={20} />
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No urgent alerts</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;

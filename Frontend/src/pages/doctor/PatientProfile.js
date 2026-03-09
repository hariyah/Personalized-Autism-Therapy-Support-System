import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import ChatBox from '../../components/ChatBox';
import AnalysisCard from '../../components/AnalysisCard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FiMessageSquare, FiUser, FiActivity, FiArrowLeft, FiPlus, FiAlertCircle, FiClipboard, FiTrendingUp, FiShield } from 'react-icons/fi';

const PatientProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get('tab') || 'overview';
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [location.search]);

    useEffect(() => {
        fetchPatientData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchPatientData = async () => {
        try {
            const [patientRes, analysesRes] = await Promise.all([
                axios.get(`/api/doctor/patients/${id}`),
                axios.get(`/api/doctor/patients/${id}/analyses`)
            ]);
            setPatient(patientRes.data.patient);
            setAnalyses(analysesRes.data.analyses || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="flex min-h-screen bg-app"><Sidebar /><div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div></div></div>;
    if (!patient) return <div className="flex min-h-screen bg-app"><Sidebar /><div className="flex-1 flex items-center justify-center flex-col text-slate-500"><FiUser size={32} className="mb-4 opacity-50" /><Link to="/doctor/dashboard" className="text-violet-400 hover:text-violet-300">Patient not found. Back to Dashboard</Link></div></div>;

    const urgencyData = analyses.reduce((acc, a) => {
        acc[a.urgencyLabel] = (acc[a.urgencyLabel] || 0) + 1;
        return acc;
    }, {});
    const chartData = Object.entries(urgencyData).map(([name, value]) => ({ name, value }));
    const COLORS = ['#f43f5e', '#f59e0b', '#10b981']; // Rose, Amber, Emerald (Tailwind 500s)

    // Calculate analysis-based severity
    const highCount = urgencyData['high'] || 0;
    const mediumCount = urgencyData['medium'] || 0;
    const lowCount = urgencyData['low'] || 0;
    const totalAnalyses = analyses.length;
    
    // Compute overall risk level based on analysis patterns
    const computedSeverity = highCount > 0 ? 'High Risk' : mediumCount > 0 ? 'Moderate' : totalAnalyses > 0 ? 'Low Risk' : 'No Data';
    const computedSeverityClass = highCount > 0 ? 'badge-high' : mediumCount > 0 ? 'badge-medium' : totalAnalyses > 0 ? 'badge-low' : 'badge-neutral';

    const severityColor = { mild: 'badge-low border-none', moderate: 'badge-medium border-none', severe: 'badge-high border-none' };

    return (
        <div className="flex min-h-screen bg-app">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8 page-enter">
                    {/* Header Controls */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <Link to="/doctor/patients" className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all card-glow"><FiArrowLeft /></Link>
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-violet-500/20">{patient.name[0]}</div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-100">{patient.name}</h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="glow-dot w-1.5 h-1.5" />
                                        <p className="text-slate-500 font-medium text-sm">Age {patient.age} • {patient.gender}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setActiveTab('chat')} className={`btn-secondary flex items-center gap-2 ${activeTab === 'chat' ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-lg shadow-violet-500/10' : ''}`}><FiMessageSquare /> <span className="hidden sm:inline">Consultation</span></button>
                            <button onClick={() => navigate(`/doctor/new-analysis/${id}`)} className="btn-primary flex items-center gap-2"><FiPlus /> New Analysis</button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1.5 bg-white/[0.02] border border-white/[0.06] rounded-xl w-fit mb-8 shadow-inner">
                        {['overview', 'analyses', 'chat'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === t ? 'bg-white/[0.08] text-violet-300 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
                        ))}
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 fade-in">
                            <div className="lg:col-span-2 space-y-8">
                                {/* Professional Overview */}
                                <section className="card p-8 card-glow relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><FiClipboard className="w-32 h-32" /></div>
                                    <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2 relative z-10"><FiUser className="text-violet-400" /> Professional Overview</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 relative z-10">
                                        <InfoBlock label="Diagnosis" value={patient.diagnosisDetails?.diagnosisType || 'N/A'} />
                                        <InfoBlock label="Diagnosis Severity" value={patient.diagnosisDetails?.severity || 'N/A'} isPill pillClass={severityColor[patient.diagnosisDetails?.severity] || 'badge-neutral'} />
                                        <InfoBlock label="Parent / Guardian" value={patient.parent?.name || 'N/A'} />
                                    </div>
                                </section>

                                {/* Analysis-Based Risk Assessment */}
                                <section className="card p-8 card-glow relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><FiShield className="w-32 h-32" /></div>
                                    <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2 relative z-10"><FiTrendingUp className="text-teal-400" /> Analysis-Based Assessment</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                                        <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05]">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Current Risk</p>
                                            <span className={`${computedSeverityClass} text-sm`}>{computedSeverity}</span>
                                        </div>
                                        <div className="bg-rose-500/5 rounded-xl p-4 border border-rose-500/20">
                                            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">High Priority</p>
                                            <p className="text-2xl font-black text-rose-400">{highCount}</p>
                                        </div>
                                        <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/20">
                                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Medium Priority</p>
                                            <p className="text-2xl font-black text-amber-400">{mediumCount}</p>
                                        </div>
                                        <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Low Priority</p>
                                            <p className="text-2xl font-black text-emerald-400">{lowCount}</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2"><FiActivity className="text-teal-400" /> Recent Analyses</h3>
                                    <div className="space-y-4">
                                        {analyses.length === 0 ? <div className="card p-10 border-dashed border-white/[0.1] text-center text-slate-500 text-sm font-medium">No clinical records found.</div> : analyses.slice(0, 3).map(a => <AnalysisCard key={a._id} analysis={a} isDoctorView />)}
                                        {analyses.length > 3 && <button onClick={() => setActiveTab('analyses')} className="w-full py-4 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-violet-400 transition-colors">View All {analyses.length} Records →</button>}
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                {/* Urgency Distribution Chart */}
                                <div className="card p-8 h-fit">
                                    <h3 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2 uppercase tracking-widest"><FiAlertCircle className="text-rose-400" /> Urgency Distribution</h3>
                                    {chartData.length > 0 ? (
                                        <div>
                                            <div className="h-52">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                                                            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex justify-center gap-4 mt-4">
                                                {['High', 'Med', 'Low'].map((l, i) => (
                                                    <div key={l} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/[0.03] px-3 py-1.5 rounded-lg">
                                                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ background: COLORS[i] }} /> {l}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-slate-600 border border-dashed border-white/[0.1] rounded-2xl bg-white/[0.01] text-xs font-medium uppercase tracking-widest">Insufficient Data</div>
                                    )}
                                </div>

                                {/* Total Analyses Summary */}
                                <div className="card p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Analyses</p>
                                            <p className="text-3xl font-black text-slate-200">{totalAnalyses}</p>
                                        </div>
                                        <div className="w-14 h-14 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                            <FiActivity className="text-violet-400" size={24} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Analyses Tab */}
                    {activeTab === 'analyses' && (
                        <div className="space-y-4 fade-in">
                            <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2"><FiActivity className="text-teal-400" /> Complete Record History</h3>
                            {analyses.length === 0 ? <p className="text-slate-500">No records found.</p> : analyses.map(a => <AnalysisCard key={a._id} analysis={a} isDoctorView />)}
                        </div>
                    )}

                    {/* Chat Tab */}
                    {activeTab === 'chat' && (
                        <div className="max-w-3xl mx-auto fade-in">
                            <div className="mb-6 bg-gradient-to-r from-violet-500/10 to-transparent p-5 rounded-2xl border border-violet-500/20 flex items-center gap-4">
                                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-bold"><FiMessageSquare /></div>
                                <div>
                                    <h4 className="font-bold text-violet-300 text-sm">Active Consultation Line</h4>
                                    <p className="text-xs text-slate-400">Secure connection with {patient.parent?.name} regarding {patient.name}</p>
                                </div>
                            </div>
                            <div className="card border-subtle bg-white/[0.02] overflow-hidden">
                                <ChatBox childId={patient._id} receiverId={patient.parent?._id} receiverName={patient.parent?.name} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const InfoBlock = ({ label, value, isPill, pillClass }) => (
    <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-600" /> {label}</p>
        <div className="pl-3">
            {isPill ? (
                <span className={`inline-block ${pillClass}`}>{value}</span>
            ) : (
                <p className="font-bold text-slate-200 capitalize text-sm">{value}</p>
            )}
        </div>
    </div>
);

export default PatientProfile;

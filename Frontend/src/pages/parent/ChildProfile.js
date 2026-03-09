import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import AnalysisCard from '../../components/AnalysisCard';
import ChatBox from '../../components/ChatBox';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FiArrowLeft, FiEdit, FiActivity, FiUser, FiInfo, FiMessageSquare, FiShield, FiTrendingUp } from 'react-icons/fi';

const ChildProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [child, setChild] = useState(null);
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
        fetchChildData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchChildData = async () => {
        try {
            const [childRes, analysesRes] = await Promise.all([
                axios.get(`/api/parent/children/${id}`),
                axios.get(`/api/parent/children/${id}/analyses`)
            ]);
            setChild(childRes.data.child);
            setAnalyses(analysesRes.data.analyses || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="flex min-h-screen bg-app"><Sidebar /><div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div></div></div>;
    if (!child) return <div className="flex min-h-screen bg-app"><Sidebar /><div className="flex-1 flex items-center justify-center text-slate-500">Child not found</div></div>;

    const urgencyData = analyses.reduce((acc, a) => {
        acc[a.urgencyLabel] = (acc[a.urgencyLabel] || 0) + 1;
        return acc;
    }, {});
    const chartData = Object.entries(urgencyData).map(([name, value]) => ({ name, value }));
    const COLORS = ['#f43f5e', '#f59e0b', '#10b981'];

    // Calculate analysis-based severity
    const highCount = urgencyData['high'] || 0;
    const mediumCount = urgencyData['medium'] || 0;
    const lowCount = urgencyData['low'] || 0;
    const totalAnalyses = analyses.length;
    
    // Compute overall risk level based on analysis patterns
    const computedSeverity = highCount > 0 ? 'High Risk' : mediumCount > 0 ? 'Moderate' : totalAnalyses > 0 ? 'Low Risk' : 'No Data';
    const computedSeverityClass = highCount > 0 ? 'badge-high' : mediumCount > 0 ? 'badge-medium' : totalAnalyses > 0 ? 'badge-low' : 'badge-neutral';

    return (
        <div className="flex min-h-screen bg-app">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8 page-enter">
                    {/* Header */}
                    <div className="mb-8">
                        <Link to="/parent/children" className="text-violet-400 hover:text-violet-300 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-6 transition-colors w-fit"><FiArrowLeft size={12} /> Return to Family</Link>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-violet-500/30 relative">
                                    {child.name[0]}
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0a0e1a] rounded-full flex items-center justify-center">
                                        <div className="glow-dot w-2.5 h-2.5" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-slate-100 leading-tight tracking-tight">{child.name}</h1>
                                    <p className="text-slate-500 font-medium text-sm mt-1">Age {child.age} • {child.gender}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button onClick={() => navigate(`/parent/therapy/${id}`)} className="btn-primary flex items-center gap-2">
                                    <FiActivity /> Therapy Dashboard
                                </button>
                                <button onClick={() => navigate(`/parent/new-analysis?childId=${id}`)} className="btn-secondary flex items-center gap-2 border-violet-500/30 text-violet-300 hover:bg-violet-500/10">
                                    <FiInfo /> New Recording
                                </button>
                                <button className="w-12 h-12 bg-white/[0.04] rounded-xl border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-sm">
                                    <FiEdit size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl w-fit mb-8 shadow-inner">
                        {['overview', 'analyses', 'consultation'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === t ? 'bg-white/[0.08] text-violet-300 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
                        ))}
                    </div>

                    {/* Content */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Diagnosis */}
                                <div className="card p-8 border-subtle relative overflow-hidden card-glow">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><FiActivity className="w-32 h-32" /></div>
                                    <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2 relative z-10"><FiUser className="text-teal-400" /> Diagnosis Profile</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 relative z-10">
                                        <Detail label="Condition" value={child.diagnosisDetails?.diagnosisType || 'N/A'} />
                                        <Detail label="Diagnosis Severity" value={child.diagnosisDetails?.severity || 'N/A'} isPill />
                                        <Detail label="Diagnosed Year" value={child.diagnosisDetails?.diagnosisDate ? new Date(child.diagnosisDetails.diagnosisDate).getFullYear().toString() : 'N/A'} />
                                    </div>
                                </div>

                                {/* Analysis-Based Risk Assessment */}
                                <div className="card p-8 card-glow relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><FiShield className="w-32 h-32" /></div>
                                    <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2 relative z-10"><FiTrendingUp className="text-teal-400" /> Analysis-Based Assessment</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                                        <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05]">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Current Risk</p>
                                            <span className={`${computedSeverityClass} text-sm`}>{computedSeverity}</span>
                                        </div>
                                        <div className="bg-rose-500/5 rounded-xl p-4 border border-rose-500/20">
                                            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">High</p>
                                            <p className="text-2xl font-black text-rose-400">{highCount}</p>
                                        </div>
                                        <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/20">
                                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Medium</p>
                                            <p className="text-2xl font-black text-amber-400">{mediumCount}</p>
                                        </div>
                                        <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Low</p>
                                            <p className="text-2xl font-black text-emerald-400">{lowCount}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Analyses */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2"><FiActivity className="text-rose-400" /> Recent AI Analyses</h3>
                                        <button onClick={() => setActiveTab('analyses')} className="text-[10px] font-bold text-violet-400 hover:text-violet-300 uppercase tracking-widest transition-colors">View All Directory →</button>
                                    </div>
                                    <div className="space-y-4">
                                        {analyses.length === 0 ? (
                                            <div className="card border-dashed border-white/[0.1] bg-white/[0.01] p-12 text-center text-slate-500 text-sm font-medium">No analysis history recorded yet. Add a new recording.</div>
                                        ) : (
                                            analyses.slice(0, 3).map(a => <AnalysisCard key={a._id} analysis={a} />)
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Chart */}
                                <div className="card p-8 card-glow">
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Urgency Distribution</h3>
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
                                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                                {['High', 'Med', 'Low'].map((l, i) => (
                                                    <div key={l} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.05]">
                                                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} /> {l}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-slate-600 border border-dashed border-white/[0.1] rounded-2xl bg-white/[0.01] text-xs font-medium uppercase tracking-widest">No chart data</div>
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

                                {/* Doctor */}
                                <div className="card border-violet-500/20 bg-gradient-to-b from-violet-500/10 to-transparent p-6 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.05]"><FiShield className="w-16 h-16 text-violet-400" /></div>
                                    <h3 className="text-xs font-bold text-violet-300 uppercase tracking-widest mb-4">Assigned Specialist</h3>
                                    {child.assignedDoctors?.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-xl border border-white/[0.05]">
                                                <div className="w-12 h-12 bg-white/[0.05] border border-white/[0.1] rounded-full flex items-center justify-center font-black text-slate-200">Dr</div>
                                                <div>
                                                    <p className="font-bold text-slate-200">
                                                        {child.assignedDoctors[0].name.startsWith('Dr') ? child.assignedDoctors[0].name : `Dr. ${child.assignedDoctors[0].name}`}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{child.assignedDoctors[0].specialization || 'Clinical Specialist'}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setActiveTab('consultation')} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                                                <FiMessageSquare size={14} /> Send Message
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs text-slate-400 leading-relaxed mb-4">No specialist assigned yet. The network will assign a doctor to review analyses soon.</p>
                                            <div className="p-3 bg-white/[0.04] rounded-xl border border-dashed border-white/[0.1] text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Status: Pending</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analyses' && (
                        <div className="space-y-4 fade-in">
                            <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2"><FiActivity className="text-teal-400" /> Complete Analysis Records</h3>
                            {analyses.map(a => <AnalysisCard key={a._id} analysis={a} />)}
                        </div>
                    )}

                    {activeTab === 'consultation' && (
                        <div className="max-w-3xl mx-auto fade-in">
                            {child.assignedDoctors?.length > 0 ? (
                                <>
                                    <div className="mb-6 bg-gradient-to-r from-teal-500/10 to-transparent p-5 rounded-2xl border border-teal-500/20 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-teal-500/20 border border-teal-500/30 rounded-xl flex items-center justify-center text-teal-400 font-black text-xl">
                                            {child.assignedDoctors[0].name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-teal-300 text-sm">Active Consultation Line</p>
                                            <p className="text-xs text-slate-400">Secure connection with {child.assignedDoctors[0].name?.startsWith('Dr') ? child.assignedDoctors[0].name : `Dr. ${child.assignedDoctors[0].name}`}</p>
                                        </div>
                                    </div>
                                    <div className="card overflow-hidden">
                                        <ChatBox childId={child._id} receiverId={child.assignedDoctors[0]._id} receiverName={child.assignedDoctors[0].name?.startsWith('Dr') ? child.assignedDoctors[0].name : `Dr. ${child.assignedDoctors[0].name}`} />
                                    </div>
                                </>
                            ) : (
                                <div className="card p-16 text-center border-dashed border-white/[0.1]">
                                    <FiShield className="mx-auto text-slate-600 mb-4" size={32} />
                                    <h3 className="font-bold text-slate-300 mb-2">No specialist assigned yet</h3>
                                    <p className="text-slate-500 text-sm">Consultation features will unlock once a clinical specialist is assigned to this profile.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Detail = ({ label, value, isPill }) => (
    <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-600" /> {label}</p>
        <div className="pl-3">
            {isPill ? (
                <span className={`badge-${value === 'severe' ? 'high' : value === 'moderate' ? 'medium' : 'low'}`}>
                    {value}
                </span>
            ) : (
                <p className="font-bold text-slate-200 capitalize text-sm">{value}</p>
            )}
        </div>
    </div>
);

export default ChildProfile;

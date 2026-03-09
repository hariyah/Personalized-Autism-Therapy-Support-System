import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import ChatBox from '../../components/ChatBox';
import NotificationBell from '../../components/NotificationBell';
import { FiUsers, FiActivity, FiAlertCircle, FiTrendingUp, FiMessageSquare, FiChevronRight, FiHeart, FiZap } from 'react-icons/fi';

const ParentDashboard = () => {
    const [children, setChildren] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);
    const [openChatChild, setOpenChatChild] = useState(null);

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        try {
            const [childrenRes, statsRes] = await Promise.all([
                axios.get('/api/parent/children'),
                axios.get('/api/parent/dashboard/stats')
            ]);
            const kids = childrenRes.data.children || [];
            setChildren(kids);
            setStats(statsRes.data.stats || {});
            const firstWithDoctor = kids.find(c => c.assignedDoctors?.length > 0);
            if (firstWithDoctor) {
                setSelectedChat({ childId: firstWithDoctor._id, doctorId: firstWithDoctor.assignedDoctors[0]._id, doctorName: firstWithDoctor.assignedDoctors[0].name });
                setOpenChatChild(firstWithDoctor._id);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally { setLoading(false); }
    };

    const handleSelectChat = (child, doctor) => {
        if (openChatChild === child._id && selectedChat?.doctorId === doctor._id) {
            setOpenChatChild(null); setSelectedChat(null);
        } else {
            setOpenChatChild(child._id);
            setSelectedChat({ childId: child._id, doctorId: doctor._id, doctorName: doctor.name });
        }
    };

    const Loader = () => (
        <div className="flex min-h-screen bg-app">
            <Sidebar />
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                    <p className="text-slate-500 text-sm font-medium">Loading your dashboard...</p>
                </div>
            </div>
        </div>
    );

    if (loading) return <Loader />;

    const statCards = [
        { label: 'Children', value: stats?.totalChildren || 0, icon: FiUsers, color: 'violet' },
        { label: 'Analyses', value: stats?.totalAnalyses || 0, icon: FiActivity, color: 'teal' },
        { label: 'This Week', value: stats?.recentAnalyses || 0, icon: FiTrendingUp, color: 'cyan' },
        { label: 'Alerts', value: stats?.urgencyCounts?.find(u => u._id === 'high')?.count || 0, icon: FiAlertCircle, color: 'rose' },
    ];

    const colorMap = {
        violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400',
        teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/20 text-teal-400',
        cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
        rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400',
    };

    return (
        <div className="flex min-h-screen bg-app">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8 page-enter">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.3em] mb-2">Family Care Console</p>
                            <h1 className="text-4xl font-black text-slate-100 tracking-tight">
                                Hello, <span className="gradient-text">{stats?.parentName || 'Parent'}</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="glow-dot" />
                                <p className="text-slate-500 text-sm font-medium">Monitoring {children.length} family member{children.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <NotificationBell />
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        {statCards.map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className={`card border bg-gradient-to-br ${colorMap[color]} p-5 card-glow`}>
                                <div className="flex items-center justify-between mb-3">
                                    <Icon size={18} className="opacity-70" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</span>
                                </div>
                                <p className="text-3xl font-black text-slate-100">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Consultations */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-black text-slate-200">Active Consultations</h2>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Live Chat Support</span>
                            </div>

                            {children.length === 0 ? (
                                <div className="card border-subtle p-16 text-center card-glow">
                                    <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <FiUsers className="text-slate-600" size={28} />
                                    </div>
                                    <h3 className="text-slate-300 font-bold mb-2">Add family members to begin</h3>
                                    <Link to="/parent/children" className="btn-primary inline-flex items-center gap-2 mt-3 text-xs">
                                        Setup Profiles <FiChevronRight size={14} />
                                    </Link>
                                </div>
                            ) : (
                                children.map(child => (
                                    <div key={child._id} className="card border-subtle overflow-hidden card-glow">
                                        <div className="p-5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-500/20">
                                                    {child.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-200">{child.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <div className={child.assignedDoctors?.length > 0 ? 'glow-dot' : 'glow-dot-rose'} />
                                                        <p className="text-xs text-slate-500 font-medium">
                                                            {child.assignedDoctors?.length > 0
                                                                ? (child.assignedDoctors[0].name.startsWith('Dr') ? child.assignedDoctors[0].name : `Dr. ${child.assignedDoctors[0].name}`)
                                                                : 'Awaiting specialist'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {child.assignedDoctors?.length > 0 && (
                                                <button
                                                    onClick={() => handleSelectChat(child, child.assignedDoctors[0])}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${openChatChild === child._id
                                                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                                        : 'btn-secondary'
                                                        }`}
                                                >
                                                    <FiMessageSquare size={13} />
                                                    {openChatChild === child._id ? 'Close' : 'Chat'}
                                                </button>
                                            )}
                                        </div>
                                        {openChatChild === child._id && selectedChat && (
                                            <div className="border-t border-white/[0.06] bg-white/[0.02]">
                                                <ChatBox childId={selectedChat.childId} receiverId={selectedChat.doctorId} receiverName={selectedChat.doctorName?.startsWith('Dr') ? selectedChat.doctorName : `Dr. ${selectedChat.doctorName}`} />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-black text-slate-200 mb-2">Care Path</h2>

                            <div className="card border-subtle p-5 card-glow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 bg-rose-500/15 border border-rose-500/25 rounded-xl flex items-center justify-center">
                                        <FiHeart className="text-rose-400" size={16} />
                                    </div>
                                    <h3 className="font-bold text-slate-200 text-sm">My Children</h3>
                                </div>
                                <p className="text-slate-500 text-xs leading-relaxed mb-4">Manage health records and review specialist feedback.</p>
                                <Link to="/parent/children" className="flex items-center justify-between p-3 bg-white/[0.04] hover:bg-white/[0.07] rounded-xl transition-all border border-white/[0.06] group">
                                    <span className="text-sm font-bold text-slate-300">Manage Profiles</span>
                                    <FiChevronRight className="text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" size={14} />
                                </Link>
                            </div>

                            <div className="card border-subtle overflow-hidden">
                                <div className="gradient-primary p-5 relative overflow-hidden">
                                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                                    <div className="relative z-10">
                                        <FiZap className="text-white/70 mb-3" size={20} />
                                        <h3 className="font-black text-white mb-1">65% Progress</h3>
                                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-2">
                                            <div className="h-full bg-white w-[65%] rounded-full shadow-glow" />
                                        </div>
                                        <p className="text-white/60 text-xs">Assessment volume up <span className="text-white font-bold">24%</span> this week</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import EmotionCapture from '../../components/therapy/EmotionCapture';
import EmotionAnalytics from '../../components/therapy/EmotionAnalytics';
import ActivityCard from '../../components/therapy/ActivityCard';
import ProgressHistory from '../../components/therapy/ProgressHistory';
import { FiArrowLeft, FiActivity, FiSmile, FiStar, FiZap } from 'react-icons/fi';

const Therapy = () => {
    const { id } = useParams();
    const [child, setChild] = useState(null);
    const [activities, setActivities] = useState([]);
    const [emotionHistory, setEmotionHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTherapyData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchTherapyData = async () => {
        try {
            const [childRes, actRes] = await Promise.all([
                axios.get(`/api/parent/children/${id}`),
                axios.get(`/api/activities/recommend/${id}`)
            ]);
            const actData = actRes.data || [];

            setChild(childRes.data.child);
            setActivities(Array.isArray(actData) ? actData : actData.activities || []);
            setEmotionHistory(childRes.data.child?.emotionHistory?.reverse() || []);
        } catch (error) { console.error('Error fetching therapy data:', error); }
        finally { setLoading(false); }
    };

    const handleEmotionCaptured = (newEntry) => {
        setEmotionHistory(prev => [newEntry, ...prev].slice(0, 50));
        fetchTherapyData(); // refresh recommendations
    };

    const handleCompleteActivity = async (activityId) => {
        try {
            await axios.post(`/api/activities/complete/${id}`, { activityId });
            fetchTherapyData(); // refresh list
        } catch (error) { console.error('Error completing activity:', error); }
    };

    if (loading) return (
        <div className="flex min-h-screen bg-app"><Sidebar />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
            </div>
        </div>
    );
    if (!child) return <div className="flex min-h-screen bg-app"><Sidebar /><div className="flex-1 flex items-center justify-center text-slate-500">Child not found</div></div>;

    const emojiMap = {
        'happy': '😄', 'sad': '😢', 'angry': '😠', 'fearful': '😨', 'surprised': '😲', 'disgusted': '🤢',
        'calm': '😌', 'neutral': '😐', 'frustrated': '😫', 'anxious': '😰', 'excited': '🤩'
    };

    return (
        <div className="flex min-h-screen bg-app">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8 page-enter">
                    {/* Header */}
                    <div className="mb-8">
                        <Link to={`/parent/children/${id}`} className="text-teal-400 hover:text-teal-300 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-6 transition-colors w-fit"><FiArrowLeft size={12} /> Back to Profile</Link>
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-teal-500/20">{child.name[0]}</div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-100 leading-tight tracking-tight">Therapy System</h1>
                                <p className="text-slate-500 font-medium text-sm mt-1">Personalized session for {child.name}</p>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center gap-4 card-glow">
                                <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20"><FiSmile className="text-rose-400" size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Current State</p>
                                    <p className="font-black text-slate-200 capitalize">{emotionHistory[0]?.emotion || 'Unknown'}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center gap-4 card-glow">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20"><FiStar className="text-amber-400" size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Tasks Done</p>
                                    <p className="font-black text-slate-200">12 Activities</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center gap-4 card-glow">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20"><FiZap className="text-emerald-400" size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Recommendation</p>
                                    <p className="font-black text-slate-200">Active Learning</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left/Main Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <EmotionCapture childId={id} onCapture={handleEmotionCaptured} />

                            {emotionHistory.length > 0 && (
                                <div className="card p-6 border-subtle">
                                    <EmotionAnalytics data={emotionHistory} />
                                </div>
                            )}

                            <div>
                                <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                                    <FiActivity className="text-teal-400" /> Prescribed Activities Network
                                </h3>
                                <div className="space-y-4">
                                    {activities.length === 0 ? (
                                        <div className="p-16 text-center border border-dashed border-white/[0.1] rounded-2xl bg-white/[0.01]">
                                            <FiStar className="text-slate-600 mx-auto mb-4" size={32} />
                                            <p className="text-slate-400 font-bold mb-1">No activities assigned</p>
                                            <p className="text-xs text-slate-500">Capture current emotion to generate ML recommendations.</p>
                                        </div>
                                    ) : (
                                        activities.map(activity => (
                                            <ActivityCard key={activity._id} activity={activity} onComplete={() => handleCompleteActivity(activity._id)} />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-8">
                            <div className="card p-6 border-subtle sticky top-8">
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Recent Biometric History</h3>
                                <div className="h-96 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                    {emotionHistory.length === 0 ? (
                                        <div className="text-center py-10 text-slate-600 text-xs font-bold uppercase tracking-widest">No state recorded</div>
                                    ) : (
                                        emotionHistory.map((hw, i) => (
                                            <div key={i} className="flex flex-col p-4 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                                                <div className="flex items-center justify-between mb-3 border-b border-white/[0.05] pb-3">
                                                    <span className="text-3xl filter drop-shadow-md">{emojiMap[hw.emotion] || '❓'}</span>
                                                    <div className="text-right">
                                                        <span className="text-slate-200 font-bold capitalize text-sm">{hw.emotion}</span>
                                                        <div className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-widest">
                                                            {hw.timestamp ? new Date(hw.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ProgressHistory emissions={hw.emotions} confidence={hw.confidence} />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Therapy;

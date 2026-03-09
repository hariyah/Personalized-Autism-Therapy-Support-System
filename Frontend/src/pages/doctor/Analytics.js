import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { FiActivity, FiUsers, FiBarChart2, FiTrendingUp } from 'react-icons/fi';

const Analytics = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/doctor/dashboard/analytics')
            .then(res => setAnalyticsData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex min-h-screen bg-app"><Sidebar />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            </div>
        </div>
    );

    const issueDist = analyticsData?.issueDistribution || [];
    const distData = issueDist.map(item => ({ name: item._id?.replace(/_/g, ' ') || 'Unknown', count: item.count }));
    const maxVal = Math.max(...distData.map(d => d.count), 1);

    return (
        <div className="flex min-h-screen bg-app">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8 page-enter">
                    {/* Header */}
                    <div className="mb-10">
                        <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                            <FiBarChart2 /> Clinical Reports Layer
                        </p>
                        <h1 className="text-4xl font-black text-slate-100 tracking-tight">Practice <span className="gradient-text">Analytics</span></h1>
                        <p className="text-slate-500 text-sm font-medium mt-2">Macro-level insights across all patient profiles.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                        {/* Summary Cards */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="card p-6 border-subtle relative overflow-hidden card-glow">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><FiUsers className="w-20 h-20" /></div>
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Total Monitored</h3>
                                <p className="text-4xl font-black text-violet-300 mb-4">{analyticsData?.totalPatients || 0}</p>
                                <div className="text-xs font-medium text-slate-400 bg-white/[0.03] px-3 py-2 rounded-lg border border-white/[0.05]">Active patient profiles</div>
                            </div>
                            <div className="card p-6 border-subtle relative overflow-hidden card-glow">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><FiActivity className="w-20 h-20" /></div>
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Assessments</h3>
                                <p className="text-4xl font-black text-teal-300 mb-4">{analyticsData?.totalAnalyses || 0}</p>
                                <div className="text-xs font-medium text-slate-400 bg-white/[0.03] px-3 py-2 rounded-lg border border-white/[0.05]">Total clinical analyses</div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="lg:col-span-3 card p-8 border-subtle card-glow flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2"><FiTrendingUp className="text-violet-400" /> Issue Distribution Frequency</h2>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-3 py-1 bg-white/[0.05] rounded-md border border-white/[0.08]">Top Patterns</span>
                            </div>
                            {distData.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center p-16 text-slate-500 border border-dashed border-white/[0.1] rounded-2xl bg-white/[0.01] text-xs font-bold uppercase tracking-widest">
                                    No analytical data points available
                                </div>
                            ) : (
                                <div className="h-80 w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={distData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} dy={10} style={{ textTransform: 'uppercase' }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                            <RechartsTooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                contentStyle={{ backgroundColor: '#161d2d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                itemStyle={{ color: '#c4b5fd', fontWeight: 'bold' }}
                                                labelStyle={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                                            />
                                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                {distData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.count === maxVal ? 'url(#colorMax)' : 'rgba(167, 139, 250, 0.4)'} />
                                                ))}
                                            </Bar>
                                            <defs>
                                                <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                                                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.7} />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;

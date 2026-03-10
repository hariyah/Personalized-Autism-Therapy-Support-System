import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { FiPieChart } from 'react-icons/fi';

const EmotionAnalytics = ({ data }) => {
    if (!data || data.length === 0) return null;

    const emotionCounts = data.reduce((acc, entry) => {
        const emotionName = entry.emotion || 'neutral';
        acc[emotionName] = (acc[emotionName] || 0) + 1;
        return acc;
    }, {});

    const pieData = Object.keys(emotionCounts).map(key => ({
        name: key,
        value: emotionCounts[key]
    }));

    const lineData = data
        .filter(entry => entry.confidence !== undefined && entry.confidence !== null)
        .map(entry => ({
            time: entry.timestamp ? format(new Date(entry.timestamp), 'MMM d, h:mm a') : 'N/A',
            confidence: Math.round(entry.confidence * 100)
        }))
        .reverse();

    const COLORS = {
        happy: '#10b981',      // Emerald 500
        sad: '#6366f1',        // Indigo 500
        angry: '#f43f5e',      // Rose 500
        fearful: '#8b5cf6',    // Violet 500
        surprised: '#f59e0b',  // Amber 500
        disgusted: '#84cc16',  // Lime 500
        calm: '#38bdf8',       // Sky 400
        frustrated: '#ef4444', // Red 500
        anxious: '#a855f7',    // Purple 500
        excited: '#fcd34d',    // Yellow 300
        neutral: '#94a3b8'     // Slate 400
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                <FiPieChart className="text-teal-400" /> Biometric Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl shadow-inner">
                {/* Pie Chart */}
                <div className="h-64 flex flex-col pt-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-2">State Distribution</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#64748b'} className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}
                                labelStyle={{ display: 'none' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Line Chart */}
                <div className="h-64 flex flex-col pt-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-2">System Confidence Trend</p>
                    {lineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#2dd4bf', fontWeight: 'bold', fontSize: '12px' }}
                                    labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                                />
                                <Line type="monotone" dataKey="confidence" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4, fill: '#2dd4bf', strokeWidth: 2, stroke: '#1e293b' }} activeDot={{ r: 6, shadow: '0 0 10px rgba(45,212,191,0.5)' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-600 border border-dashed border-white/[0.1] rounded-xl text-[10px] font-bold uppercase tracking-widest m-4">
                            Not enough automated data points
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
                {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.05]">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[d.name] || '#64748b' }}></span>
                        {d.name} <span className="text-white opacity-50 ml-1">({d.value})</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmotionAnalytics;

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const UrgencyTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const { label, value, color } = payload[0].payload;
    const suffix = value === 1 ? 'analysis' : 'analyses';

    return (
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1220]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {label} Priority
            </p>
            <div className="mt-2 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                <p className="text-sm font-bold text-slate-100">
                    {value} {suffix}
                </p>
            </div>
        </div>
    );
};

const UrgencyDonutChart = ({ data = [], emptyMessage = 'No chart data' }) => {
    const visibleData = data.filter(item => item.value > 0);

    if (visibleData.length === 0) {
        return (
            <div className="h-40 flex items-center justify-center text-slate-600 border border-dashed border-white/[0.1] rounded-2xl bg-white/[0.01] text-xs font-medium uppercase tracking-widest">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div>
            <div className="relative h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={visibleData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={visibleData.length > 1 ? 3 : 0}
                            cornerRadius={visibleData.length > 1 ? 4 : 12}
                            dataKey="value"
                            stroke="none"
                        >
                            {visibleData.map(entry => (
                                <Cell key={entry.key} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<UrgencyTooltip />} cursor={false} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
                {data.map(item => (
                    <div
                        key={item.key}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                    >
                        <div
                            className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                            style={{ backgroundColor: item.color, opacity: item.value > 0 ? 1 : 0.35 }}
                        />
                        <span>{item.shortLabel}</span>
                        <span className="text-slate-500">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UrgencyDonutChart;

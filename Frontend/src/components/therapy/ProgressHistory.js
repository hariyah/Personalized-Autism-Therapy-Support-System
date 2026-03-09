import React from 'react';
import { FiCheckCircle, FiActivity, FiZap } from 'react-icons/fi';

const ProgressHistory = ({ emissions, confidence }) => {
    // Primary emotions out of the 6 detected via webcam ML
    const primaryEmotions = [
        { key: 'happy', label: 'Happy', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/50' },
        { key: 'sad', label: 'Sad', color: 'bg-indigo-500', shadow: 'shadow-indigo-500/50' },
        { key: 'angry', label: 'Angry', color: 'bg-rose-500', shadow: 'shadow-rose-500/50' },
        { key: 'fearful', label: 'Fearful', color: 'bg-violet-500', shadow: 'shadow-violet-500/50' },
        { key: 'disgusted', label: 'Disgusted', color: 'bg-lime-500', shadow: 'shadow-lime-500/50' },
        { key: 'surprised', label: 'Surprised', color: 'bg-amber-500', shadow: 'shadow-amber-500/50' },
        { key: 'neutral', label: 'Neutral', color: 'bg-slate-400', shadow: 'shadow-slate-400/50' },
        { key: 'calm', label: 'Calm', color: 'bg-teal-400', shadow: 'shadow-teal-400/50' },
        { key: 'frustrated', label: 'Frustrated', color: 'bg-red-500', shadow: 'shadow-red-500/50' },
        { key: 'anxious', label: 'Anxious', color: 'bg-purple-500', shadow: 'shadow-purple-500/50' },
        { key: 'excited', label: 'Excited', color: 'bg-yellow-400', shadow: 'shadow-yellow-400/50' }
    ];

    if (!emissions) return null;

    // Filter to only show emotions that have a value > 1% to reduce clutter
    const visibleEmotions = primaryEmotions
        .filter(e => emissions[e.key] !== undefined && emissions[e.key] > 0.01)
        .sort((a, b) => emissions[b.key] - emissions[a.key]);

    return (
        <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5"><FiActivity className="text-violet-400" /> Biometric Detail</p>
                {confidence !== undefined && confidence !== null ? (
                    <p className="text-[9px] font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1"><FiCheckCircle /> {(confidence * 100).toFixed(0)}% Confidence</p>
                ) : (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20">Manual Entity</span>
                )}
            </div>

            <div className="space-y-3">
                {visibleEmotions.map((emotion) => {
                    const value = emissions[emotion.key];
                    const percent = Math.round(value * 100);
                    return (
                        <div key={emotion.key} className="relative group">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-200 transition-colors w-20 truncate">
                                    {emotion.label}
                                </span>
                                <span className="text-[10px] font-black text-slate-300">
                                    {percent}%
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden flex shadow-inner">
                                <div
                                    className={`h-full ${emotion.color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.1)] relative`}
                                    style={{ width: `${percent}%` }}
                                >
                                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/30 to-transparent rounded-r-full pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {confidence !== undefined && confidence !== null && (
                <div className="mt-4 pt-4 border-t border-white/[0.05]">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FiZap className="text-amber-400" /> System Confidence</p>
                    <div className="h-0.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-1000 ease-out"
                            style={{ width: `${confidence * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressHistory;

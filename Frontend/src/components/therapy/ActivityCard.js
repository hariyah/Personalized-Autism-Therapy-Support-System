import React from 'react';
import { FiClock, FiStar, FiCheck, FiPlayCircle, FiZap } from 'react-icons/fi';

const categoryColors = {
    'Focus & Attention': { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    'Emotional Regulation': { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
    'Social Skills': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    'Communication': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    'default': { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' }
};

const ActivityCard = ({ activity, onComplete }) => {
    const isCompleted = activity.status === 'completed';
    const styles = categoryColors[activity.category] || categoryColors['default'];

    return (
        <div className={`card overflow-hidden group transition-all duration-300 relative ${isCompleted ? 'opacity-70 border-white/[0.04]' : 'border-subtle card-glow'}`}>
            {isCompleted && <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />}

            <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.bg} opacity-80 ${isCompleted ? 'bg-emerald-500' : ''}`} />

            <div className="p-6 pl-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border ${styles.bg} ${styles.text} ${styles.border}`}>
                                {activity.category}
                            </span>
                            {activity.targetEmotion && (
                                <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                                    Target: {activity.targetEmotion}
                                </span>
                            )}
                        </div>
                        <h4 className={`text-lg font-bold mb-1.5 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-200 group-hover:text-violet-300'} transition-colors leading-tight`}>
                            {activity.title}
                        </h4>
                        <p className={`text-sm leading-relaxed ${isCompleted ? 'text-slate-500' : 'text-slate-400'}`}>
                            {activity.description}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <FiClock size={12} className={isCompleted ? 'text-slate-600' : 'text-teal-400'} />
                                {activity.duration} mins
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <FiStar size={12} className={isCompleted ? 'text-slate-600' : 'text-amber-400'} />
                                Rating: {activity.effectivenessScore?.toFixed(1) || '0.0'}/5.0
                            </div>
                        </div>

                        {activity.instructions && !isCompleted && (
                            <div className="mt-5 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-xs text-slate-300 leading-relaxed font-medium">
                                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black mb-2 flex items-center gap-1.5"><FiPlayCircle size={12} className="text-violet-400" /> Action Steps</p>
                                <ul className="list-disc pl-4 space-y-1.5 marker:text-violet-500 marker:text-[10px]">
                                    {activity.instructions.map((inst, idx) => (
                                        <li key={idx}>{inst}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 flex items-center mt-2 sm:mt-0">
                        {isCompleted ? (
                            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
                                <FiCheck size={14} /> Completed
                            </div>
                        ) : (
                            <button
                                onClick={onComplete}
                                className="w-full sm:w-auto px-6 py-3 gradient-primary rounded-xl font-black uppercase tracking-[0.1em] text-white text-[10px] shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <FiZap fill="currentColor" size={12} /> Mark Finished
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityCard;

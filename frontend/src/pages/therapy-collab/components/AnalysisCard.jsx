import React, { useState } from 'react';
import { FiChevronDown, FiActivity, FiMessageSquare, FiVolume2, FiClipboard, FiShield, FiTarget } from 'react-icons/fi';
import { format } from 'date-fns';
import {
    formatAnalysisLabel,
    getCareStageLabel,
    getDisplayedSummary,
    getDisplayedTreatmentSuggestions,
    getDoctorReview,
    getResultSummary,
    getTreatmentStatusLabel
} from '../utils/analysisInsights';

const AnalysisCard = ({ analysis, isDoctorView = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getUrgencyConfig = (urgency) => {
        switch (urgency) {
            case 'high': return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', line: 'bg-rose-500' };
            case 'medium': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', line: 'bg-amber-500' };
            case 'low': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', line: 'bg-emerald-500' };
            default: return { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', line: 'bg-violet-500' };
        }
    };

    const config = getUrgencyConfig(analysis.urgencyLabel);
    const review = getDoctorReview(analysis);
    const resultSummary = getDisplayedSummary(analysis);
    const aiSummary = getResultSummary(analysis);
    const treatmentSuggestions = getDisplayedTreatmentSuggestions(analysis);

    return (
        <div className="card overflow-hidden card-glow relative group">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.line} opacity-80 group-hover:opacity-100 transition-opacity`} />

            <div className="p-6 sm:p-8 pl-10">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                    <div className="flex items-start gap-5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${config.bg} ${config.border} ${config.text} group-hover:scale-105 transition-transform shadow-lg shadow-black/20`}>
                            {analysis.inputType === 'text' ? <FiClipboard size={20} /> : <FiVolume2 size={20} />}
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`text-[9px] uppercase font-black px-2.5 py-1 rounded-md border ${config.bg} ${config.text} ${config.border} tracking-widest`}>
                                    {formatAnalysisLabel(analysis.urgencyLabel)} Priority
                                </span>
                                <span className="text-[9px] uppercase font-black px-2.5 py-1 rounded-md border bg-white/[0.04] text-slate-300 border-white/[0.1] tracking-widest">
                                    {formatAnalysisLabel(analysis.issueLabel)}
                                </span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-200 leading-snug group-hover:text-violet-300 transition-colors">{analysis.summary}</h4>
                        </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{format(new Date(analysis.createdAt), 'MMM d, yyyy')}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{format(new Date(analysis.createdAt), 'h:mm a')}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.05] pt-5">
                    <div className="flex flex-wrap gap-2">
                        {analysis.issueTop3?.slice(0, 2).map((issue, i) => (
                            <span key={i} className="px-3 py-1 bg-white/[0.03] text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/[0.05]">
                                {formatAnalysisLabel(issue.label)}
                            </span>
                        ))}
                        {review?.reviewedAt && (
                            <>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-emerald-500/20">
                                    {getTreatmentStatusLabel(analysis)}
                                </span>
                                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-cyan-500/20">
                                    {getCareStageLabel(analysis)}
                                </span>
                            </>
                        )}
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`btn-secondary !py-2 !px-4 !rounded-lg text-[10px] uppercase tracking-widest flex items-center gap-2 w-full sm:w-auto justify-center ${isExpanded ? '!bg-white/[0.08] !text-violet-700' : ''}`}
                    >
                        {isExpanded ? 'Collapse' : 'Deep Analysis'}
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><FiChevronDown size={14} /></div>
                    </button>
                </div>

                {/* Expanded State */}
                {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-white/[0.05] space-y-6 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Transcript */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <FiClipboard className="text-violet-400" /> AI Transcript Record
                                </p>
                                <div className="p-5 bg-white/[0.02] rounded-xl border border-white/[0.05] italic text-sm text-slate-400 leading-relaxed relative">
                                    <div className="absolute top-0 right-0 p-3 opacity-10"><FiActivity size={24} /></div>
                                    "{analysis.transcript}"
                                </div>
                            </div>

                            {/* Results */}
                            <div className="space-y-5">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <FiShield className="text-teal-400" /> Results
                                    </p>
                                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5 text-sm leading-relaxed text-slate-300">
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                                                <FiTarget size={11} />
                                                {formatAnalysisLabel(analysis.issueLabel)}
                                            </span>
                                            <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${config.bg} ${config.text} ${config.border}`}>
                                                <FiActivity size={11} />
                                                {formatAnalysisLabel(analysis.urgencyLabel)} urgency
                                            </span>
                                        </div>
                                        {resultSummary}
                                        {review?.finalSummary && aiSummary !== review.finalSummary && (
                                            <p className="mt-3 text-xs leading-6 text-slate-500">
                                                AI summary: {aiSummary}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <FiActivity className="text-teal-400" /> Pattern Recognition
                                    </p>
                                    <div className="space-y-4">
                                        {analysis.issueTop3?.map((issue, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                                    <span className="text-slate-300">{formatAnalysisLabel(issue.label)}</span>
                                                    <span className="text-teal-400">{(issue.confidence * 100).toFixed(0)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden shadow-inner flex">
                                                    <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(45,212,191,0.5)]" style={{ width: `${issue.confidence * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                                {review?.reviewedAt ? 'Doctor Final Treatment Plan' : 'Suggested Treatment'}
                            </p>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {treatmentSuggestions.map((suggestion, index) => (
                                    <div key={`${analysis._id || analysis.createdAt}-${index}`} className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-black/10 p-4">
                                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                                        <p className="text-sm leading-6 text-slate-200">{suggestion}</p>
                                    </div>
                                ))}
                            </div>
                            {review?.reviewedAt && (
                                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="rounded-xl border border-white/[0.05] bg-black/10 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reviewed By</p>
                                        <p className="mt-2 text-sm text-slate-200">{review.doctorName || review.doctor?.name || 'Doctor'}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.05] bg-black/10 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reviewed On</p>
                                        <p className="mt-2 text-sm text-slate-200">{format(new Date(review.reviewedAt), 'MMM d, yyyy')}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.05] bg-black/10 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Next Review</p>
                                        <p className="mt-2 text-sm text-slate-200">{review.nextReviewDate ? format(new Date(review.nextReviewDate), 'MMM d, yyyy') : 'Not scheduled'}</p>
                                    </div>
                                </div>
                            )}
                            {review?.followUpPlan && (
                                <div className="mt-4 rounded-xl border border-white/[0.05] bg-black/10 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Follow-Up Plan</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-200">{review.followUpPlan}</p>
                                </div>
                            )}
                        </div>

                        {/* Doctor specific Action */}
                        {isDoctorView && (
                            <button className="w-full mt-4 py-3 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-violet-500/20 hover:text-violet-200 transition-all flex items-center justify-center gap-2">
                                <FiMessageSquare size={14} /> Open Secure Consultation Channel
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisCard;

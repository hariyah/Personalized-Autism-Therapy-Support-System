import React from 'react';
import { FiActivity, FiAlertCircle, FiClipboard, FiShield, FiTarget } from 'react-icons/fi';
import {
    formatAnalysisLabel,
    getDisplayedTreatmentSuggestions,
    getDisplayedSummary,
    getDoctorReview,
    getIssueLabel,
    getIssuePatternData,
    getResultSummary,
    getUrgencyLabel
} from '../utils/analysisInsights';

const urgencyConfig = {
    high: {
        badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        panel: 'border-rose-500/20 bg-rose-500/5'
    },
    medium: {
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        panel: 'border-amber-500/20 bg-amber-500/5'
    },
    low: {
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        panel: 'border-emerald-500/20 bg-emerald-500/5'
    }
};

function ResultsDisplay({ results }) {
    if (!results) return null;

    const issueLabel = getIssueLabel(results);
    const urgencyLabel = getUrgencyLabel(results);
    const resultSummary = getDisplayedSummary(results);
    const aiSummary = getResultSummary(results);
    const treatmentSuggestions = getDisplayedTreatmentSuggestions(results);
    const review = getDoctorReview(results);
    const transcript = results.transcript || '';
    const issuePatterns = getIssuePatternData(results);
    const primaryConfidence = issuePatterns[0]?.confidence;
    const config = urgencyConfig[urgencyLabel] || {
        badge: 'bg-white/[0.05] text-slate-300 border-white/[0.08]',
        panel: 'border-white/[0.08] bg-white/[0.02]'
    };

    return (
        <div className="space-y-6">
            <div className={`rounded-2xl border ${config.panel} p-6`}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">AI Results</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                                <FiTarget size={12} />
                                {formatAnalysisLabel(issueLabel)}
                            </span>
                            <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${config.badge}`}>
                                <FiAlertCircle size={12} />
                                {formatAnalysisLabel(urgencyLabel)} urgency
                            </span>
                            {typeof primaryConfidence === 'number' && (
                                <span className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                                    <FiActivity size={12} />
                                    {Math.round(primaryConfidence * 100)}% confidence
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-white/[0.08] bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
                        Saved with this record and shown in history.
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="space-y-3">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                        <FiClipboard size={12} className="text-violet-300" />
                        AI Transcript Record
                    </p>
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                        <div className="rounded-2xl border border-white/[0.05] bg-slate-950/40 p-5 text-lg italic leading-9 text-slate-400">
                            "{transcript || 'No transcript available.'}"
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                            <FiShield size={12} className="text-teal-300" />
                            Results
                        </p>
                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                            <div className="mb-4 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                                    <FiTarget size={12} />
                                    {formatAnalysisLabel(issueLabel)}
                                </span>
                                <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${config.badge}`}>
                                    <FiAlertCircle size={12} />
                                    {formatAnalysisLabel(urgencyLabel)} urgency
                                </span>
                                {review?.reviewedAt && (
                                    <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                                        Completed
                                    </span>
                                )}
                            </div>
                            <p className="text-sm leading-7 text-slate-300">{resultSummary}</p>
                            {aiSummary !== resultSummary && (
                                <p className="mt-4 text-sm leading-7 text-slate-500">
                                    AI summary: {aiSummary}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                            <FiActivity size={12} className="text-teal-300" />
                            Pattern Recognition
                        </p>
                        <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                            {issuePatterns.length > 0 ? issuePatterns.map((pattern) => (
                                <div key={pattern.key} className="space-y-2">
                                    <div className="flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-[0.18em]">
                                        <span className="text-slate-300">{pattern.label}</span>
                                        <span className="text-teal-300">{pattern.percentage}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.05] shadow-inner">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 shadow-[0_0_12px_rgba(45,212,191,0.45)] transition-all duration-700"
                                            style={{ width: `${pattern.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-5 text-xs font-medium uppercase tracking-widest text-slate-500">
                                    No pattern data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
                    <FiActivity size={12} />
                    {review?.reviewedAt ? 'Doctor Final Treatment Plan' : 'Suggested Treatment'}
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {treatmentSuggestions.map((suggestion, index) => (
                        <div key={`${issueLabel}-${index}`} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/10 p-4">
                            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                            <p className="text-sm leading-6 text-slate-200">{suggestion}</p>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs leading-6 text-slate-500">
                AI-generated support suggestions should be reviewed with clinical judgment before final treatment decisions.
            </p>
        </div>
    );
}

export default ResultsDisplay;

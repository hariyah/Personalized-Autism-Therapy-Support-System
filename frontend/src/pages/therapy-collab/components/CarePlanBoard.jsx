import React from 'react';
import { FiActivity, FiClock, FiDownload, FiFileText, FiRefreshCw, FiShield } from 'react-icons/fi';
import { formatAnalysisLabel, getCareStageLabel, getDisplayedSummary, getDisplayedTreatmentSuggestions, getDoctorReview, getIssueLabel, getTreatmentStatusLabel } from '../utils/analysisInsights';

const CarePlanBoard = ({ analyses, isDoctorView = false, onDownloadReport, onOpenReview }) => {
    const reviewedAnalyses = analyses.filter(analysis => getDoctorReview(analysis)?.reviewedAt);
    const ongoingAnalyses = reviewedAnalyses.filter(analysis => {
        const review = getDoctorReview(analysis);
        return review?.treatmentStatus !== 'completed' && review?.careStage !== 'completed';
    });
    const pendingReviewAnalyses = analyses.filter(analysis => !getDoctorReview(analysis)?.reviewedAt);

    return (
        <div className="space-y-8">
            <section>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <FiActivity className="text-emerald-400" />
                        Ongoing Treatment
                    </h3>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{ongoingAnalyses.length} active plans</span>
                </div>
                {ongoingAnalyses.length === 0 ? (
                    <div className="card p-10 border-dashed border-white/[0.1] text-center text-slate-500 text-sm font-medium">
                        No active treatment plans yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {ongoingAnalyses.map(analysis => {
                            const review = getDoctorReview(analysis);
                            return (
                                <div key={analysis._id} className="card p-6 border-subtle">
                                    <div className="mb-4 flex flex-wrap items-center gap-2">
                                        <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
                                            {formatAnalysisLabel(getIssueLabel(analysis))}
                                        </span>
                                        <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                                            {getTreatmentStatusLabel(analysis)}
                                        </span>
                                        <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
                                            {getCareStageLabel(analysis)}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-7 text-slate-300">{getDisplayedSummary(analysis)}</p>
                                    <div className="mt-4 space-y-3">
                                        {getDisplayedTreatmentSuggestions(analysis).slice(0, 3).map((item, index) => (
                                            <div key={`${analysis._id}-plan-${index}`} className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                                                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                                                <p className="text-sm leading-6 text-slate-200">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {review?.nextReviewDate && (
                                        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                                            Next review: {new Date(review.nextReviewDate).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="card p-6 border-subtle">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <FiClock className="text-violet-400" />
                            Care Process
                        </h3>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{pendingReviewAnalyses.length} pending</span>
                    </div>
                    <div className="space-y-3">
                        {pendingReviewAnalyses.length === 0 ? (
                            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-sm text-slate-500">
                                No analyses are waiting for review.
                            </div>
                        ) : (
                            pendingReviewAnalyses.map(analysis => (
                                <div key={analysis._id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                                        Awaiting doctor review
                                    </p>
                                    <p className="mt-2 text-sm text-slate-200">{formatAnalysisLabel(getIssueLabel(analysis))}</p>
                                    <p className="mt-2 text-sm text-slate-400">{analysis.resultSummary || analysis.summary}</p>
                                    {isDoctorView && (
                                        <button onClick={() => onOpenReview?.(analysis)} className="mt-4 btn-secondary flex items-center gap-2">
                                            <FiRefreshCw size={14} />
                                            Open Review
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card p-6 border-subtle">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <FiFileText className="text-cyan-400" />
                            Reports Ready
                        </h3>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{reviewedAnalyses.length} documents</span>
                    </div>
                    <div className="space-y-3">
                        {reviewedAnalyses.length === 0 ? (
                            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-sm text-slate-500">
                                The doctor has not published any treatment reports yet.
                            </div>
                        ) : (
                            reviewedAnalyses.map(analysis => {
                                const review = getDoctorReview(analysis);
                                return (
                                    <div key={`${analysis._id}-report`} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
                                                    {formatAnalysisLabel(getIssueLabel(analysis))} report
                                                </p>
                                                <p className="mt-2 text-sm text-slate-300">
                                                    Reviewed by {review.doctorName || review.doctor?.name || 'doctor'} on {new Date(review.reviewedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button onClick={() => onDownloadReport?.(analysis._id)} className="btn-secondary flex items-center gap-2">
                                                <FiDownload size={14} />
                                                Download Report
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>

            <section>
                <h3 className="mb-4 text-lg font-bold text-slate-100 flex items-center gap-2">
                    <FiShield className="text-violet-400" />
                    Reviewed Timeline
                </h3>
                {reviewedAnalyses.length === 0 ? (
                    <div className="card p-10 border-dashed border-white/[0.1] text-center text-slate-500 text-sm font-medium">
                        Reviewed care steps will appear here after the doctor finalizes a treatment plan.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviewedAnalyses.map(analysis => {
                            const review = getDoctorReview(analysis);
                            return (
                                <div key={`${analysis._id}-timeline`} className="card p-6 border-subtle">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                                                {formatAnalysisLabel(getIssueLabel(analysis))}
                                            </p>
                                            <p className="mt-2 text-sm leading-7 text-slate-300">{review.finalSummary || getDisplayedSummary(analysis)}</p>
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            <p>Reviewed: {new Date(review.reviewedAt).toLocaleDateString()}</p>
                                            <p>Status: {getTreatmentStatusLabel(analysis)}</p>
                                            <p>Stage: {getCareStageLabel(analysis)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default CarePlanBoard;

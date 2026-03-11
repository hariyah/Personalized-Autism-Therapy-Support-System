import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiCheckCircle, FiChevronDown, FiEdit3, FiFileText, FiSave } from 'react-icons/fi';
import { getDisplayedSummary, getDisplayedTreatmentSuggestions } from '../utils/analysisInsights';

const DoctorReviewPanel = ({ analysis, onSaved }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [finalSummary, setFinalSummary] = useState('');
    const [treatmentText, setTreatmentText] = useState('');
    const [treatmentStatus, setTreatmentStatus] = useState('recommended');
    const [careStage, setCareStage] = useState('reviewed');
    const [followUpPlan, setFollowUpPlan] = useState('');
    const [nextReviewDate, setNextReviewDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const review = analysis?.doctorReview || {};
        setFinalSummary(review.finalSummary || getDisplayedSummary(analysis));
        setTreatmentText((review.finalTreatmentSuggestions || getDisplayedTreatmentSuggestions(analysis)).join('\n'));
        setTreatmentStatus(review.treatmentStatus || 'recommended');
        setCareStage(review.careStage || 'reviewed');
        setFollowUpPlan(review.followUpPlan || '');
        setNextReviewDate(review.nextReviewDate ? new Date(review.nextReviewDate).toISOString().slice(0, 10) : '');
        setSuccess('');
        setError('');
    }, [analysis]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                finalSummary,
                finalTreatmentSuggestions: treatmentText
                    .split(/\r?\n/)
                    .map(item => item.trim())
                    .filter(Boolean),
                treatmentStatus,
                careStage,
                followUpPlan,
                nextReviewDate: nextReviewDate || undefined
            };

            const response = await axios.put(`/api/doctor/analyses/${analysis._id}/review`, payload);
            setSuccess('Treatment plan saved and report published for the parent.');
            setIsOpen(false);
            onSaved?.(response.data.analysis);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to save doctor review.');
        } finally {
            setLoading(false);
        }
    };

    const review = analysis?.doctorReview;

    return (
        <div className="card border-subtle p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Doctor Check</p>
                    <h4 className="mt-2 text-lg font-black text-slate-100">
                        {review?.reviewedAt ? 'Update Final Treatment Plan' : 'Review AI Result and Finalize Plan'}
                    </h4>
                    <p className="mt-2 text-sm text-slate-400">
                        {review?.reviewedAt
                            ? `Last reviewed by ${review.doctorName || review.doctor?.name || 'doctor'} on ${new Date(review.reviewedAt).toLocaleDateString()}.`
                            : 'Confirm the AI result, adjust the treatment, and publish the parent report.'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(prev => !prev)}
                    className="btn-secondary flex items-center justify-center gap-2"
                >
                    {review?.reviewedAt ? <FiEdit3 size={14} /> : <FiFileText size={14} />}
                    {review?.reviewedAt ? 'Update Review' : 'Start Review'}
                    <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} size={14} />
                </button>
            </div>

            {success && (
                <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">
                    <FiCheckCircle className="inline mr-2" size={14} />
                    {success}
                </div>
            )}
            {error && (
                <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-300">
                    {error}
                </div>
            )}

            {isOpen && (
                <form onSubmit={handleSubmit} className="mt-6 space-y-5 border-t border-white/[0.06] pt-6">
                    <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">
                            Final Summary
                        </label>
                        <textarea
                            className="input-dark min-h-[130px] resize-y"
                            value={finalSummary}
                            onChange={(e) => setFinalSummary(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
                            Final Treatment Items
                        </label>
                        <textarea
                            className="input-dark min-h-[160px] resize-y"
                            value={treatmentText}
                            onChange={(e) => setTreatmentText(e.target.value)}
                            placeholder="Enter one treatment action per line"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                Treatment Status
                            </label>
                            <select className="input-dark w-full" value={treatmentStatus} onChange={(e) => setTreatmentStatus(e.target.value)}>
                                <option value="recommended">Recommended</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="monitoring">Monitoring</option>
                                <option value="adjusted">Adjusted</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                Care Stage
                            </label>
                            <select className="input-dark w-full" value={careStage} onChange={(e) => setCareStage(e.target.value)}>
                                <option value="reviewed">Reviewed</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="follow_up">Follow Up</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                Next Review Date
                            </label>
                            <input
                                type="date"
                                className="input-dark w-full"
                                value={nextReviewDate}
                                onChange={(e) => setNextReviewDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                Follow-Up Plan
                            </label>
                            <textarea
                                className="input-dark min-h-[84px] resize-y"
                                value={followUpPlan}
                                onChange={(e) => setFollowUpPlan(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex items-center justify-center gap-2"
                    >
                        <FiSave size={14} />
                        {loading ? 'Saving...' : 'Save Review and Publish Report'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default DoctorReviewPanel;

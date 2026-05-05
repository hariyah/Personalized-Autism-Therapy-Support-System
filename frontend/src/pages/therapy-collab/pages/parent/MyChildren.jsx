import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import therapyApi from '../../utils/therapyApi';
import { getApiErrorMessage } from '../../utils/apiErrorMessage';
import { BASE } from '../../routes';
import { FiPlus, FiUser, FiCalendar, FiActivity, FiX, FiCheckCircle, FiChevronRight, FiTrash2 } from 'react-icons/fi';

const createEmptyFormData = () => ({
    name: '',
    age: '',
    gender: 'male',
    dateOfBirth: '',
    diagnosisDetails: {
        diagnosisType: 'Autism Spectrum Disorder',
        severity: 'mild',
        diagnosisDate: ''
    }
});

const formatDateForInput = (value) => {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateInput = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const calculateAgeFromDateOfBirth = (value) => {
    const birthDate = parseDateInput(value);
    if (!birthDate) return null;

    const today = new Date();
    if (birthDate > today) return null;

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const hasNotHadBirthdayYet =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate());

    if (hasNotHadBirthdayYet) {
        age -= 1;
    }

    return age >= 0 ? age : null;
};

const MyChildren = () => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(createEmptyFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [formError, setFormError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletingChildId, setDeletingChildId] = useState('');

    useEffect(() => { fetchChildren(); }, []);

    const fetchChildren = async () => {
        try {
            const res = await therapyApi.get('/api/parent/children');
            setChildren(res.data.children || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const resetFormState = () => {
        setFormData(createEmptyFormData());
        setSuccessMsg('');
        setFormError('');
        setIsSubmitting(false);
    };

    const handleOpenModal = () => {
        resetFormState();
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetFormState();
    };

    const handleDateOfBirthChange = (value) => {
        const computedAge = calculateAgeFromDateOfBirth(value);

        setFormData(prev => ({
            ...prev,
            dateOfBirth: value,
            age: computedAge === null ? '' : String(computedAge)
        }));

        if (formError) {
            setFormError('');
        }
    };

    const handleAddChild = async (e) => {
        e.preventDefault();
        setFormError('');

        const trimmedName = formData.name.trim();
        const computedAge = calculateAgeFromDateOfBirth(formData.dateOfBirth);

        if (!trimmedName) {
            setFormError('Full name is required.');
            return;
        }

        if (computedAge === null) {
            setFormError('Date of birth must be today or a past date.');
            return;
        }

        setIsSubmitting(true);
        try {
            await therapyApi.post('/api/parent/children', {
                ...formData,
                name: trimmedName,
                age: computedAge
            });
            setSuccessMsg('Profile registered successfully!');
            setTimeout(() => {
                handleCloseModal();
                fetchChildren();
            }, 1500);
        } catch (err) {
            console.error(err);
            setFormError(err.response?.data?.message || 'Unable to register this child profile right now.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteChild = async () => {
        if (!deleteTarget?._id) return;

        setDeletingChildId(deleteTarget._id);
        try {
            await therapyApi.delete(`/api/parent/children/${deleteTarget._id}`);
            setChildren(prev => prev.filter(child => child._id !== deleteTarget._id));
            setDeleteTarget(null);
        } catch (err) {
            console.error(err);
            setFormError(getApiErrorMessage(err, 'Unable to delete this child profile right now.'));
        } finally {
            setDeletingChildId('');
        }
    };

    if (loading) return (
        <div className="flex min-h-screen bg-app"><Sidebar />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            </div>
        </div>
    );

    const severityColor = { mild: 'badge-low', moderate: 'badge-medium', severe: 'badge-high' };

    return (
        <div className="flex min-h-screen bg-app">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8 page-enter">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.3em] mb-2">Family Records</p>
                            <h1 className="text-4xl font-black text-slate-100 tracking-tight">My <span className="gradient-text">Children</span></h1>
                            <p className="text-slate-500 text-sm font-medium mt-2">{children.length} registered profile{children.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button
                            onClick={handleOpenModal}
                            className="btn-primary flex items-center gap-2"
                        >
                            <FiPlus size={16} /> Register New Profile
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {children.length === 0 ? (
                            <div className="col-span-full card border-subtle p-20 text-center card-glow">
                                <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <FiUser className="text-slate-600" size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-300 mb-2">Your Family Dashboard is Ready</h3>
                                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Add your first child profile to begin AI-powered assessments.</p>
                                <button onClick={handleOpenModal} className="btn-primary inline-flex items-center gap-2">
                                    <FiPlus size={14} /> Add Child Profile
                                </button>
                            </div>
                        ) : (
                            children.map(child => (
                                <div key={child._id} className="relative">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteTarget(child);
                                            setFormError('');
                                        }}
                                        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl border border-rose-500/20 bg-slate-950/70 text-rose-300 hover:bg-rose-500/15 hover:border-rose-500/40 transition-all flex items-center justify-center"
                                        aria-label={`Delete ${child.name}`}
                                        title={`Delete ${child.name}`}
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                    <Link
                                        to={`${BASE}/parent/children/${child._id}`}
                                        className="card border-subtle p-5 block hover:border-violet-500/25 hover:bg-white/[0.02] transition-all duration-300 group card-glow"
                                    >
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                                                {child.name[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-200 group-hover:text-violet-300 transition-colors">{child.name}</h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <div className="glow-dot w-1.5 h-1.5" />
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                        Active | {child.age ?? 'N/A'} Years Old
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 border-t border-white/[0.05] pt-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <FiCalendar size={13} className="text-slate-600" />
                                                <span>Born {new Date(child.dateOfBirth).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <FiActivity size={13} className="text-slate-600" />
                                                <span className="capitalize">{child.diagnosisDetails?.diagnosisType || 'No diagnosis set'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
                                            <span className={severityColor[child.diagnosisDetails?.severity] || 'badge-neutral'}>
                                                {child.diagnosisDetails?.severity || 'mild'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {child.assignedDoctors?.length > 0 ? (
                                                    <div className="flex -space-x-2">
                                                        {child.assignedDoctors.slice(0, 3).map((dr, i) => (
                                                            <div key={i} className="w-7 h-7 rounded-full gradient-primary border-2 border-[#161d2d] flex items-center justify-center text-[10px] font-black text-white shadow-sm" title={dr.name?.startsWith('Dr') ? dr.name : `Dr. ${dr.name}`}>
                                                                {dr.name[0]}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Awaiting specialist</span>
                                                )}
                                                <FiChevronRight className="text-slate-700 group-hover:text-violet-400 transition-colors" size={14} />
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="card border-subtle rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.3em] mb-1">Registration Portal</p>
                                <h2 className="text-2xl font-black text-slate-100">Add Family Member</h2>
                            </div>
                            <button onClick={handleCloseModal} className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-violet-500 transition-all">
                                <FiX size={16} />
                            </button>
                        </div>

                        {successMsg ? (
                            <div className="p-20 text-center">
                                <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FiCheckCircle className="text-emerald-400" size={28} />
                                </div>
                                <h3 className="text-xl font-black text-slate-200 mb-1">{successMsg}</h3>
                                <p className="text-slate-500 text-sm">Updating family dashboard...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleAddChild} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {formError ? (
                                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                                        {formError}
                                    </div>
                                ) : null}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label-dark">Full Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input-dark"
                                            placeholder="e.g., Leo Maxwell"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-dark">Age</label>
                                        <input
                                            type="number"
                                            value={formData.age}
                                            readOnly
                                            className="input-dark cursor-not-allowed opacity-80"
                                            placeholder="Auto-calculated from birth date"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-dark">Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="input-dark"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label-dark">Date of Birth</label>
                                        <input
                                            required
                                            type="date"
                                            value={formData.dateOfBirth}
                                            max={formatDateForInput(new Date())}
                                            onChange={(e) => handleDateOfBirthChange(e.target.value)}
                                            className="input-dark"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <FiActivity size={12} className="text-violet-400" /> Diagnosis Profile
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label-dark">Condition</label>
                                            <input
                                                type="text"
                                                value={formData.diagnosisDetails.diagnosisType}
                                                onChange={(e) => setFormData({ ...formData, diagnosisDetails: { ...formData.diagnosisDetails, diagnosisType: e.target.value } })}
                                                className="input-dark"
                                            />
                                        </div>
                                        <div>
                                            <label className="label-dark">Severity Level</label>
                                            <select
                                                value={formData.diagnosisDetails.severity}
                                                onChange={(e) => setFormData({ ...formData, diagnosisDetails: { ...formData.diagnosisDetails, severity: e.target.value } })}
                                                className="input-dark"
                                            >
                                                <option value="mild">Mild</option>
                                                <option value="moderate">Moderate</option>
                                                <option value="severe">Severe</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSubmitting} className="btn-primary flex-[2] disabled:opacity-50">
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...
                                            </span>
                                        ) : 'Register Profile'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className="card border-subtle rounded-3xl w-full max-w-md p-6 shadow-2xl shadow-slate-900/30">
                        <div className="w-14 h-14 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300 flex items-center justify-center mb-4">
                            <FiTrash2 size={24} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-100 mb-2">Delete Child Profile?</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            This will permanently remove <span className="font-bold text-slate-200">{deleteTarget.name}</span> and related analysis, messages, and assignments from the therapy hub.
                        </p>
                        {formError ? (
                            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                                {formError}
                            </div>
                        ) : null}
                        <div className="flex gap-3 pt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteTarget(null);
                                    setFormError('');
                                }}
                                disabled={deletingChildId === deleteTarget._id}
                                className="btn-secondary flex-1 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteChild}
                                disabled={deletingChildId === deleteTarget._id}
                                className="flex-1 rounded-2xl border border-rose-500/20 bg-rose-500/15 px-5 py-3 text-sm font-bold text-rose-200 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                            >
                                {deletingChildId === deleteTarget._id ? 'Deleting...' : 'Delete Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyChildren;

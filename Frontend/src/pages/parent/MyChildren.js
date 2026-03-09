import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import { FiPlus, FiUser, FiCalendar, FiActivity, FiX, FiCheckCircle, FiChevronRight } from 'react-icons/fi';

const MyChildren = () => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', age: '', gender: 'male', dateOfBirth: '',
        diagnosisDetails: { diagnosisType: 'Autism Spectrum Disorder', severity: 'mild', diagnosisDate: '' }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => { fetchChildren(); }, []);

    const fetchChildren = async () => {
        try {
            const res = await axios.get('/api/parent/children');
            setChildren(res.data.children || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleAddChild = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('/api/parent/children', formData);
            setSuccessMsg('Profile registered successfully!');
            setTimeout(() => {
                setIsModalOpen(false); setSuccessMsg(''); fetchChildren();
                setFormData({ name: '', age: '', gender: 'male', dateOfBirth: '', diagnosisDetails: { diagnosisType: 'Autism Spectrum Disorder', severity: 'mild', diagnosisDate: '' } });
            }, 1500);
        } catch (err) { console.error(err); }
        finally { setIsSubmitting(false); }
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
                    {/* Header */}
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.3em] mb-2">Family Records</p>
                            <h1 className="text-4xl font-black text-slate-100 tracking-tight">My <span className="gradient-text">Children</span></h1>
                            <p className="text-slate-500 text-sm font-medium mt-2">{children.length} registered profile{children.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <FiPlus size={16} /> Register New Profile
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {children.length === 0 ? (
                            <div className="col-span-full card border-subtle p-20 text-center card-glow">
                                <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <FiUser className="text-slate-600" size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-300 mb-2">Your Family Dashboard is Ready</h3>
                                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Add your first child profile to begin AI-powered assessments.</p>
                                <button onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
                                    <FiPlus size={14} /> Add Child Profile
                                </button>
                            </div>
                        ) : (
                            children.map(child => (
                                <Link to={`/parent/children/${child._id}`} key={child._id}
                                    className="card border-subtle p-5 block hover:border-violet-500/25 hover:bg-white/[0.02] transition-all duration-300 group card-glow">
                                    {/* Avatar + Name */}
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                                            {child.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-200 group-hover:text-violet-300 transition-colors">{child.name}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="glow-dot w-1.5 h-1.5" />
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                    Active • {child.age} Years Old
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
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

                                    {/* Footer */}
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
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-[#111827] border border-white/[0.08] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/60 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.3em] mb-1">Registration Portal</p>
                                <h2 className="text-2xl font-black text-slate-100">Add Family Member</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition-all">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label-dark">Full Name</label>
                                        <input required type="text" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input-dark" placeholder="e.g., Leo Maxwell" />
                                    </div>
                                    <div>
                                        <label className="label-dark">Age</label>
                                        <input required type="number" value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            className="input-dark" placeholder="e.g., 5" />
                                    </div>
                                    <div>
                                        <label className="label-dark">Gender</label>
                                        <select value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="input-dark">
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label-dark">Date of Birth</label>
                                        <input required type="date" value={formData.dateOfBirth}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            className="input-dark" />
                                    </div>
                                </div>

                                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <FiActivity size={12} className="text-violet-400" /> Diagnosis Profile
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label-dark">Condition</label>
                                            <input type="text" value={formData.diagnosisDetails.diagnosisType}
                                                onChange={(e) => setFormData({ ...formData, diagnosisDetails: { ...formData.diagnosisDetails, diagnosisType: e.target.value } })}
                                                className="input-dark" />
                                        </div>
                                        <div>
                                            <label className="label-dark">Severity Level</label>
                                            <select value={formData.diagnosisDetails.severity}
                                                onChange={(e) => setFormData({ ...formData, diagnosisDetails: { ...formData.diagnosisDetails, severity: e.target.value } })}
                                                className="input-dark">
                                                <option value="mild">Mild</option>
                                                <option value="moderate">Moderate</option>
                                                <option value="severe">Severe</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">
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
        </div>
    );
};

export default MyChildren;

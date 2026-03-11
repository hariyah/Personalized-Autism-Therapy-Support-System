import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import therapyApi from '../../utils/therapyApi';
import { BASE } from '../../routes';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import { FiUsers, FiSearch, FiChevronRight, FiFilter, FiActivity } from 'react-icons/fi';

const Patients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { fetchPatients(); }, []);

    const fetchPatients = async () => {
        try {
            const res = await therapyApi.get('/api/doctor/patients');
            setPatients(res.data.patients || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.parent?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex min-h-screen bg-app"><Sidebar />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
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
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-[0.3em] mb-2">Patient Directory</p>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">My <span className="gradient-text">Patients</span></h1>
                            <p className="text-slate-500 text-sm font-medium mt-2">Manage and monitor all assigned children</p>
                        </div>
                        <NotificationBell />
                    </div>

                    <div className="card border-subtle overflow-hidden mb-8 card-glow">
                        {/* Search Bar */}
                        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center bg-slate-50">
                            <div className="relative flex-1 w-full">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search by name or parent..."
                                    className="input-dark pl-11"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="btn-secondary flex items-center gap-2 px-6 py-3 whitespace-nowrap">
                                <FiFilter /> Filter List
                            </button>
                        </div>

                        {/* List */}
                        <div className="divide-y divide-slate-200">
                            {filteredPatients.length === 0 ? (
                                <div className="p-20 text-center bg-slate-50">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                                        <FiUsers className="text-slate-600" size={24} />
                                    </div>
                                    <h3 className="text-slate-600 font-bold mb-1">No patients found</h3>
                                    <p className="text-slate-500 text-sm">Try adjusting your search filters.</p>
                                </div>
                            ) : (
                                filteredPatients.map(p => (
                                    <Link to={`${BASE}/doctor/patients/${p._id}`} key={p._id} className="flex items-center justify-between p-6 hover:bg-slate-100 hover:border-emerald-500/20 transition-all group">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform">
                                                {p.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">{p.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                    <FiUsers size={12} className="text-slate-600" />
                                                    Parent: <span className="text-slate-400 font-medium">{p.parent?.name || 'Unknown'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-10">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 flex items-center justify-end gap-1">
                                                    <FiActivity size={10} className="text-emerald-500" /> Status
                                                </p>
                                                <span className={severityColor[p.diagnosisDetails?.severity] || 'badge-neutral'}>
                                                    {p.diagnosisDetails?.severity || 'Stable'}
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 group-hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] transition-all">
                                                <FiChevronRight className="text-slate-500 group-hover:text-emerald-600 transition-colors" />
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Patients;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiLock, FiArrowRight, FiHeart, FiShield, FiAlertCircle } from 'react-icons/fi';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'parent' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await register(formData);
            if (user.role === 'doctor') navigate('/doctor/dashboard');
            else navigate('/parent/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check your information.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-app flex overflow-hidden">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-cyan-600 to-violet-700 opacity-90" />
                <div className="absolute top-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full -ml-48 -mt-48 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-teal-400/20 rounded-full -mr-36 -mb-36 blur-2xl" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-teal-600 font-black text-xl shadow-lg">A</div>
                    <span className="text-2xl font-black text-white tracking-tight">AutismCare</span>
                </div>

                <div className="relative z-10">
                    <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">
                        Precision Support<br />
                        <span className="text-teal-200">For Every Family.</span>
                    </h2>
                    <p className="text-white/70 text-lg font-medium leading-relaxed max-w-md mb-10">
                        Join thousands of parents and specialists working together for better outcomes.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { icon: FiHeart, label: 'Family Care', sub: 'Parent portal access' },
                            { icon: FiShield, label: 'Clinical Hub', sub: 'Doctor workspace' },
                        ].map(({ icon: Icon, label, sub }) => (
                            <div key={label} className="bg-white/[0.08] backdrop-blur-md border border-white/[0.15] rounded-2xl p-4">
                                <Icon className="text-teal-300 mb-2" size={20} />
                                <p className="text-white font-bold text-sm">{label}</p>
                                <p className="text-white/50 text-xs mt-0.5">{sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] font-bold">AutismCare AI Platform v4.2</p>
                </div>
            </div>

            {/* Right Panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-[#0d1220]">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600/5 rounded-full -ml-32 -mb-32 blur-3xl" />
                <div className="max-w-md w-full relative z-10">
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-black text-lg">A</div>
                        <span className="gradient-text text-xl font-black">AutismCare</span>
                    </div>

                    <div className="mb-10">
                        <p className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.3em] mb-3">Join The Platform</p>
                        <h1 className="text-3xl font-black text-slate-100 mb-2">Create Your Account</h1>
                        <p className="text-slate-500 text-sm font-medium">Set up your profile to get started</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-rose-400 text-sm font-semibold flex items-center gap-3 animate-shake">
                                <FiAlertCircle size={16} className="shrink-0" /> {error}
                            </div>
                        )}

                        {/* Role Selector */}
                        <div>
                            <label className="label-dark">I am a</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['parent', 'doctor'].map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role })}
                                        className={`py-3 rounded-xl text-xs font-bold capitalize transition-all border ${formData.role === role
                                            ? 'gradient-primary border-transparent text-white shadow-lg shadow-violet-500/25'
                                            : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.07]'
                                            }`}
                                    >
                                        {role === 'parent' ? '👨‍👧 Parent' : '🩺 Doctor'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="label-dark">Full Name</label>
                            <div className="relative">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input type="text" required value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-dark !pl-11" placeholder="Your full name" />
                            </div>
                        </div>

                        <div>
                            <label className="label-dark">Email Address</label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input type="email" required value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-dark !pl-11" placeholder="you@example.com" />
                            </div>
                        </div>

                        <div>
                            <label className="label-dark">Password</label>
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input type="password" required value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input-dark !pl-11" placeholder="Minimum 8 characters" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 gradient-primary rounded-xl font-bold text-white text-sm shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><span>Create Account</span><FiArrowRight size={15} /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-violet-400 hover:text-violet-300 transition-colors">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

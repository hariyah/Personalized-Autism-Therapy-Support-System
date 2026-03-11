import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiArrowRight, FiShield, FiActivity, FiAlertCircle } from 'react-icons/fi';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            if (user.role === 'doctor') navigate('/doctor/dashboard');
            else navigate('/parent/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-app flex overflow-hidden">
            {/* Left Panel */}
            <div className="gradient-surface hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 gradient-primary opacity-90" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zMHY2aDZ2LTZoLTZ6TTYgNHY2aDZWNEg2em0wIDMwdjZoNnYtNkg2em0xNS0xNXY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-100" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/20 rounded-full -ml-36 -mb-36 blur-2xl" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-violet-600 font-black text-xl shadow-lg">A</div>
                    <span className="text-2xl font-black text-white tracking-tight">AutismCare</span>
                </div>

                {/* Hero */}
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8 backdrop-blur-md">
                        <div className="glow-dot w-1.5 h-1.5 bg-emerald-300" />
                        <span className="text-white/80 text-xs font-semibold">2,500+ Families Trust Us</span>
                    </div>
                    <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">
                        AI-Powered<br />
                        <span className="text-teal-200">Autism Support</span>
                    </h2>
                    <p className="text-white/70 text-lg font-medium leading-relaxed max-w-md">
                        Real-time behavioral analysis, personalized therapy recommendations, and seamless specialist collaboration.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-12">
                        {[
                            { icon: FiShield, label: 'HIPAA Compliant', sub: 'Fully encrypted data' },
                            { icon: FiActivity, label: 'AI Analysis', sub: 'Real-time insights' },
                        ].map(({ icon: Icon, label, sub }) => (
                            <div key={label} className="bg-white/[0.08] backdrop-blur-md border border-white/[0.15] rounded-2xl p-4">
                                <Icon className="text-teal-300 mb-2" size={20} />
                                <p className="text-white font-bold text-sm">{label}</p>
                                <p className="text-white/70 text-xs mt-0.5">{sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">AutismCare AI Platform v4.2</p>
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-[#0d1220]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="max-w-md w-full relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-black text-lg">A</div>
                        <span className="gradient-text text-xl font-black">AutismCare</span>
                    </div>

                    <div className="mb-10">
                        <p className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.3em] mb-3">Welcome Back</p>
                        <h1 className="text-3xl font-black text-slate-100 mb-2">Sign in to your account</h1>
                        <p className="text-slate-500 text-sm font-medium">Enter your credentials to continue</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-rose-400 text-sm font-semibold flex items-center gap-3 animate-shake">
                                <FiAlertCircle size={16} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="label-dark">Email Address</label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-dark !pl-11"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="label-dark" style={{ marginBottom: 0 }}>Password</label>
                                <button type="button" className="text-[10px] font-bold text-violet-400 hover:text-violet-300 uppercase tracking-widest transition-colors">
                                    Forgot?
                                </button>
                            </div>
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-dark !pl-11"
                                    placeholder="••••••••"
                                />
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
                                <><span>Sign In</span><FiArrowRight size={15} /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
                        <p className="text-sm text-slate-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-violet-400 hover:text-violet-300 transition-colors">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

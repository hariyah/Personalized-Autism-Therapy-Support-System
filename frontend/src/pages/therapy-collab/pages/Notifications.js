import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useNotifications } from '../contexts/NotificationContext';
import { FiBell, FiCheckCircle, FiAlertCircle, FiInfo, FiTrash2 } from 'react-icons/fi';

const NotificationsPage = () => {
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const navigate = useNavigate();

    const handleClick = (n) => {
        markAsRead(n._id);
        if (n.action_url) navigate(n.action_url);
    };

    const getIcon = (severity) => {
        switch (severity) {
            case 'high': return <FiAlertCircle className="text-rose-400" size={18} />;
            case 'medium': return <FiInfo className="text-amber-400" size={18} />;
            default: return <FiInfo className="text-violet-400" size={18} />;
        }
    };

    const getBadgeStyle = (severity) => {
        switch (severity) {
            case 'high': return 'bg-rose-500/15 border border-rose-500/30 text-rose-400';
            case 'medium': return 'bg-amber-500/15 border border-amber-500/30 text-amber-400';
            default: return 'bg-violet-500/15 border border-violet-500/30 text-violet-400';
        }
    };

    return (
        <div className="flex min-h-screen bg-app">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="max-w-5xl mx-auto p-8 page-enter">
                    {/* Header */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                <span className={notifications.some(n => !n.isRead) ? 'glow-dot' : 'glow-dot bg-slate-500 shadow-slate-500/50'} />
                                Alert Center
                            </p>
                            <h1 className="text-4xl font-black text-slate-100 tracking-tight">System <span className="gradient-text">Notifications</span></h1>
                            <p className="text-slate-500 text-sm font-medium mt-2">Manage all incoming alerts and activity updates.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={markAllAsRead}
                                className="btn-secondary flex items-center gap-2 border-slate-300 hover:border-violet-300 hover:text-violet-500"
                            >
                                <FiCheckCircle size={14} /> Mark all read
                            </button>
                            <button
                                onClick={clearAll}
                                className="btn-danger flex items-center gap-2"
                            >
                                <FiTrash2 size={14} /> Clear list
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="card overflow-hidden card-glow">
                        {notifications.length === 0 ? (
                            <div className="p-20 text-center">
                                <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
                                    <FiBell className="text-slate-600" size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-300 mb-2">No active alerts</h3>
                                <p className="text-slate-500 text-sm max-w-sm mx-auto">You're all caught up. Any new analysis alerts or updates will appear here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/[0.05]">
                                {notifications.map((n) => (
                                    <div
                                        key={n._id}
                                        onClick={() => handleClick(n)}
                                        className={`p-6 cursor-pointer flex flex-col sm:flex-row gap-5 transition-all group relative overflow-hidden ${n.isRead ? 'hover:bg-white/[0.02]' : 'bg-gradient-to-r from-violet-500/[0.05] to-transparent hover:from-violet-500/10'
                                            }`}
                                    >
                                        {!n.isRead && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                                        )}

                                        <div className={`w-12 h-12 flex items-center justify-center rounded-2xl shrink-0 transition-transform group-hover:scale-105 ${getBadgeStyle(n.severity)}`}>
                                            {getIcon(n.severity)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                                                <div>
                                                    <h4 className={`text-base leading-snug tracking-wide group-hover:text-violet-300 transition-colors ${!n.isRead ? 'font-black text-slate-100' : 'font-bold text-slate-300'}`}>
                                                        {n.title}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1.5 opacity-80">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md ${getBadgeStyle(n.severity)}`}>
                                                            {n.severity} Priority
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                            {new Date(n.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className={`text-sm leading-relaxed mt-2 ${!n.isRead ? 'text-slate-300' : 'text-slate-400'}`}>
                                                {n.message}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;

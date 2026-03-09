import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationBell = () => {
    const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClick = (n) => {
        markAsRead(n._id);
        if (n.action_url) navigate(n.action_url);
        setIsOpen(false);
    };

    const getIcon = (severity) => {
        switch (severity) {
            case 'high': return <FiAlertCircle className="text-rose-400" size={16} />;
            case 'medium': return <FiInfo className="text-amber-400" size={16} />;
            default: return <FiInfo className="text-violet-400" size={16} />;
        }
    };

    const getBadge = (severity) => {
        switch (severity) {
            case 'high': return 'bg-rose-500/15 border-rose-500/30';
            case 'medium': return 'bg-amber-500/15 border-amber-500/30';
            default: return 'bg-violet-500/15 border-violet-500/30';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-200 border ${isOpen
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : 'bg-white/[0.05] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'
                    }`}
            >
                <FiBell size={18} className={isOpen ? 'animate-pulse-glow' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 gradient-primary text-white text-[9px] font-black flex items-center justify-center rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 card border border-white/[0.08] shadow-2xl shadow-black/40 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                        <div>
                            <h3 className="font-bold text-slate-200 text-sm">Notifications</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">{unreadCount} unread</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                                >
                                    <FiCheckCircle size={11} /> All read
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-slate-400 transition-colors">
                                <FiX size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center">
                                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                                    <FiBell className="text-slate-600" size={18} />
                                </div>
                                <p className="text-sm text-slate-500 font-medium">All caught up!</p>
                            </div>
                        ) : (
                            notifications.slice(0, 15).map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => handleClick(n)}
                                    className={`flex gap-3 px-4 py-3 cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors relative ${!n.isRead ? 'bg-violet-500/[0.04]' : ''}`}
                                >
                                    {!n.isRead && (
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-500 rounded-r-full" />
                                    )}
                                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border ${getBadge(n.severity)}`}>
                                        {getIcon(n.severity)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs leading-snug truncate ${!n.isRead ? 'font-bold text-slate-200' : 'font-medium text-slate-400'}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-[10px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                                        <p className="text-[9px] text-slate-600 mt-1 font-medium">
                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;

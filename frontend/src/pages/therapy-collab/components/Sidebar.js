import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BASE } from '../routes';
import {
    FiGrid, FiUsers, FiLogOut, FiPlusCircle, FiTrendingUp,
    FiSettings, FiHelpCircle, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';

const Sidebar = () => {
    const { user, logout, isParent } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };

    const navItems = isParent ? [
        { name: 'Dashboard', icon: FiGrid, path: `${BASE}/parent/dashboard` },
        { name: 'My Children', icon: FiUsers, path: `${BASE}/parent/children` },
        { name: 'New Analysis', icon: FiPlusCircle, path: `${BASE}/parent/new-analysis` },
    ] : [
        { name: 'Dashboard', icon: FiGrid, path: `${BASE}/doctor/dashboard` },
        { name: 'My Patients', icon: FiUsers, path: `${BASE}/doctor/patients` },
        { name: 'New Analysis', icon: FiPlusCircle, path: `${BASE}/doctor/new-analysis` },
        { name: 'Analytics', icon: FiTrendingUp, path: `${BASE}/doctor/analytics` },
    ];

    return (
        <div className={`relative h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0 z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-500 transition-all z-50 shadow-md"
            >
                {collapsed ? <FiChevronRight size={12} /> : <FiChevronLeft size={12} />}
            </button>

            <div
                className={`${collapsed ? 'p-4 justify-center' : 'px-6 py-6'} flex items-center gap-3 cursor-pointer`}
                onClick={() => navigate(isParent ? `${BASE}/parent/dashboard` : `${BASE}/doctor/dashboard`)}
            >
                <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-emerald-500/30 shrink-0">
                    A
                </div>
                {!collapsed && (
                    <div>
                        <span className="gradient-text text-lg font-black block leading-tight tracking-tight">AutismCare</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">AI Support v4</span>
                    </div>
                )}
            </div>

            <div className="mx-4 h-px bg-slate-200 mb-4" />

            <div className={`flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1`}>
                {!collapsed && (
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.25em] px-3 mb-3">Navigation</p>
                )}
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        title={collapsed ? item.name : ''}
                        className={({ isActive }) =>
                            `sidebar-item ${isActive ? 'sidebar-item-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={`shrink-0 ${isActive ? 'text-emerald-600' : ''} ${collapsed ? '' : 'w-4 h-4'}`} size={16} />
                                {!collapsed && <span>{item.name}</span>}
                                {isActive && !collapsed && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}

                {!collapsed && (
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.25em] px-3 mt-6 mb-3">Support</p>
                )}

                {collapsed && <div className="h-px bg-slate-200 my-3 mx-1" />}

                <button
                    className={`sidebar-item w-full ${collapsed ? 'justify-center px-0' : ''}`}
                    title={collapsed ? 'Settings' : ''}
                >
                    <FiSettings size={16} className="shrink-0" />
                    {!collapsed && <span>Settings</span>}
                </button>
                <button
                    className={`sidebar-item w-full ${collapsed ? 'justify-center px-0' : ''}`}
                    title={collapsed ? 'Help' : ''}
                >
                    <FiHelpCircle size={16} className="shrink-0" />
                    {!collapsed && <span>Help Center</span>}
                </button>
            </div>

            <div className="p-3 border-t border-slate-200">
                {collapsed ? (
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center p-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
                        title="Sign Out"
                    >
                        <FiLogOut size={16} />
                    </button>
                ) : (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center text-white font-black text-base shrink-0 shadow-md shadow-emerald-500/20">
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 truncate leading-tight">{user?.name}</p>
                                <p className="text-[10px] font-semibold text-slate-500 capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all text-xs font-bold border border-rose-200"
                        >
                            <FiLogOut size={13} /> Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;

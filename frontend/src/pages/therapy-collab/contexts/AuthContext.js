import React, { createContext, useState, useContext, useEffect } from 'react';
import therapyApi, { syncTherapyToken } from '../utils/therapyApi';
import { BASE } from '../routes';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                setLoading(false);
                return;
            }

            syncTherapyToken();

            try {
                const meRes = await therapyApi.get('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                localStorage.setItem(AUTH_USER_KEY, JSON.stringify(meRes.data.user));
                setUser(meRes.data.user);
            } catch (err) {
                try {
                    const savedUser = localStorage.getItem(AUTH_USER_KEY);
                    const guardian = savedUser ? JSON.parse(savedUser) : {};

                    const bridgeRes = await therapyApi.post(
                        '/api/auth/bridge',
                        { name: guardian.fullName || guardian.name || '' },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(bridgeRes.data.user));
                    setUser(bridgeRes.data.user);
                } catch (bridgeErr) {
                    console.error('Therapy-collab auth initialization failed:', bridgeErr);
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                    localStorage.removeItem(AUTH_USER_KEY);
                    syncTherapyToken();
                    setUser(null);
                }
            }
            setLoading(false);
        };
        initializeAuth();
    }, []);

    const login = async (email, password) => {
        const res = await therapyApi.post('/api/auth/login', { email, password });
        localStorage.setItem(AUTH_TOKEN_KEY, res.data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.data.user));
        syncTherapyToken();
        setUser(res.data.user);
        return res.data.user;
    };

    const register = async (userData) => {
        const res = await therapyApi.post('/api/auth/register', userData);
        localStorage.setItem(AUTH_TOKEN_KEY, res.data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.data.user));
        syncTherapyToken();
        setUser(res.data.user);
        return res.data.user;
    };

    const logout = () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        syncTherapyToken();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            isAuthenticated: !!user,
            isParent: user?.role === 'parent',
            isDoctor: user?.role === 'doctor',
            loginPath: `${BASE}/login`
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useState, useContext, useEffect } from 'react';
import therapyApi, { syncTherapyToken } from '../utils/therapyApi';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const setAuth = (token, userData) => {
        if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
        if (userData) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
        setUser(userData || null);
        syncTherapyToken();
    };

    useEffect(() => {
        const bridgeAuth = async () => {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                setLoading(false);
                return;
            }

            syncTherapyToken();

            try {
                const savedUser = localStorage.getItem(AUTH_USER_KEY);
                const guardian = savedUser ? JSON.parse(savedUser) : {};

                const res = await therapyApi.post(
                    '/api/auth/bridge',
                    { name: guardian.fullName || guardian.name || '' },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setUser(res.data.user);
            } catch (err) {
                console.error('Therapy-collab auth bridge failed:', err);
            }
            setLoading(false);
        };
        bridgeAuth();
    }, []);

    const login = async (email, password) => {
        const res = await therapyApi.post('/api/auth/login', { email, password });
        const { token, user: userData } = res.data;
        setAuth(token, userData);
        return userData;
    };

    const register = async (formData) => {
        const res = await therapyApi.post('/api/auth/register', {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role || 'parent',
        });
        const { token, user: userData } = res.data;
        setAuth(token, userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
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
            isDoctor: user?.role === 'doctor'
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

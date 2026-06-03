import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { authApi, setAuthToken } from '../api/client';
import type { User, UserLogin, UserCreate } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: UserLogin) => Promise<User>;
  register: (userData: UserCreate) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setAuthToken(token);
        authApi.getMe().catch((err: unknown) => {
          if (cancelled) return;
          const status = axios.isAxiosError(err) ? err.response?.status : undefined;
          if (status === 401) {
            logout();
          }
        });
      } catch {
        logout();
      }
    }
    setLoading(false);
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (credentials: UserLogin): Promise<User> => {
    const tokenData = await authApi.login(credentials);
    setAuthToken(tokenData.token);
    setUser(tokenData.user);
    localStorage.setItem('auth_user', JSON.stringify(tokenData.user));
    return tokenData.user;
  };

  const register = async (userData: UserCreate): Promise<User> => {
    const tokenData = await authApi.register(userData);
    setAuthToken(tokenData.token);
    setUser(tokenData.user);
    localStorage.setItem('auth_user', JSON.stringify(tokenData.user));
    return tokenData.user;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


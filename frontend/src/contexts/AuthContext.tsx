import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, setAuthToken } from '../api/client';
import type { User, UserLogin, UserCreate } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setAuthToken(token);
        // Verify token is still valid
        authApi.getMe().catch(() => {
          logout();
        });
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: UserLogin) => {
    const tokenData = await authApi.login(credentials);
    setAuthToken(tokenData.access_token);
    setUser(tokenData.user);
    localStorage.setItem('auth_user', JSON.stringify(tokenData.user));
  };

  const register = async (userData: UserCreate) => {
    await authApi.register(userData);
    // After registration, log in
    await login({ username: userData.username, password: userData.password });
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


// Reads auth from main app's localStorage (auth_token / auth_user).
// Login/register handled by main app at /login and /register.
import { createContext, useContext, useState, useEffect } from "react";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({ ...parsed, uid: parsed.id });
        setProfile(parsed);
      } catch (_) {}
    }
    setLoading(false);
  }, []);

  function logout() {
    setUser(null);
    setProfile(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

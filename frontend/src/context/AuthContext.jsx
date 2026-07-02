import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [portalUser, setPortalUser] = useState(() => {
    const saved = localStorage.getItem('portalUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !user) {
      authAPI.getProfile()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('portalUser');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { accessToken, refreshToken, user: userData } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch (e) { /* ok */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('portalUser');
    setPortalUser(null);
    setUser(null);
  }, []);

  const enterPortal = useCallback((targetUser) => {
    localStorage.setItem('portalUser', JSON.stringify(targetUser));
    setPortalUser(targetUser);
  }, []);

  const exitPortal = useCallback(() => {
    localStorage.removeItem('portalUser');
    setPortalUser(null);
  }, []);

  const activeUser = portalUser || user;
  const isAdmin = activeUser?.role === 'super_admin' || activeUser?.role === 'admin';
  const isSuperAdmin = activeUser?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{
      user: activeUser,
      realUser: user,
      portalUser,
      isImpersonating: !!portalUser,
      enterPortal,
      exitPortal,
      login,
      logout,
      loading,
      isAdmin,
      isSuperAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

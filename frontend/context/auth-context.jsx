'use client';

/**
 * CivIQ Auth Context
 *
 * Provides: user, role, isAuthenticated, login(token, user), logout()
 * Hydrates from localStorage on mount via GET /api/auth/me
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'civiq_session_token';

function setCookie(name, value, days = 30) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);

  // Hydrate on mount — validate stored token against backend
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.id) {
          setUser(data);
          if (data.role) setCookie('civiq_role', data.role);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (userData?.role) setCookie('civiq_role', userData.role);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_) { /* ignore network errors on logout */ }
    }
    localStorage.removeItem(TOKEN_KEY);
    deleteCookie('civiq_role');
    setUser(null);
  }, []);

  const getToken = useCallback(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

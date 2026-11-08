import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const PRESET_USERS = [
  {
    username: 'alex.morgan',
    password: 'ciso2026',
    name: 'Alex Morgan',
    role: 'Admin',
    title: 'Chief Information Security Officer (CISO)',
    desc: 'Full command authority & board brief signatory'
  },
  {
    username: 'sarah.chen',
    password: 'respond2026',
    name: 'Sarah Chen',
    role: 'Responder',
    title: 'Lead DFIR Specialist',
    desc: 'Asset quarantine, timeline author, triage'
  },
  {
    username: 'legal.counsel',
    password: 'legal2026',
    name: 'Winstead Legal Team',
    role: 'Viewer',
    title: 'External Breach Counsel',
    desc: 'Read-only observer for regulatory & privilege record'
  },
  {
    username: 'admin',
    password: 'admin123',
    name: 'Command Ops Admin',
    role: 'Admin',
    title: 'System Administrator',
    desc: 'User management & platform configuration'
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('beeswax_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    async function checkAuth() {
      const savedToken = localStorage.getItem('beeswax_token');
      if (!savedToken) {
        // Auto-login as the demo CISO for immediate seamless demo experience
        await quickLogin('alex.morgan');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(savedToken);
        } else {
          localStorage.removeItem('beeswax_token');
          await quickLogin('alex.morgan');
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        await quickLogin('alex.morgan');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  async function login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('beeswax_token', data.token);
    return data.user;
  }

  async function quickLogin(username) {
    const preset = PRESET_USERS.find(p => p.username === username);
    if (!preset) return;
    try {
      return await login(preset.username, preset.password);
    } catch (err) {
      console.error('Quick login error:', err);
    }
  }

  function logout() {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('beeswax_token');
  }

  const canWrite = user?.role === 'Admin' || user?.role === 'Responder';
  const isAdmin = user?.role === 'Admin';
  const isViewer = user?.role === 'Viewer';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      quickLogin,
      logout,
      canWrite,
      isAdmin,
      isViewer
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

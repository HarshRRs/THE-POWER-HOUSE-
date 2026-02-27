'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '@/lib/api';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('boss_token');
    if (stored) {
      setToken(stored);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || `Login failed (${res.status})` };
      }

      const accessToken = data.data?.accessToken;
      if (accessToken) {
        setToken(accessToken);
        localStorage.setItem('boss_token', accessToken);
        return { success: true };
      }
      return { success: false, error: 'No access token in response' };
    } catch (err) {
      return { success: false, error: `Network error: ${err instanceof Error ? err.message : 'unknown'}` };
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('boss_token');
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import api, { setAccessToken, getErrorMessage, fetchCsrfToken } from "@/lib/api";

interface User {
    id: string;
    email: string;
    phone?: string | null;
    whatsappNumber?: string | null;
    telegramChatId?: string | null;
    role: string;
    plan: string;
    planExpiresAt: string | null;
    emailVerified?: boolean;
    notifyEmail?: boolean;
    notifyWhatsapp?: boolean;
    notifyTelegram?: boolean;
    notifySms?: boolean;
    notifyFcm?: boolean;
    createdAt?: string;
    _count?: { alerts: number };
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, phone?: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const res = await api.get("/auth/me");
            setUser(res.data.data);
        } catch {
            setUser(null);
            setAccessToken(null);
        }
    }, []);

    // On mount: fetch CSRF token and try to restore session via refresh token (httpOnly cookie)
    useEffect(() => {
        async function initAuth() {
            // First, ensure we have a CSRF token
            await fetchCsrfToken();
            
            // Then attempt to get a new access token using the httpOnly cookie
            try {
                const res = await api.post("/auth/refresh", {});
                const { accessToken } = res.data.data;
                setAccessToken(accessToken);
                
                const userRes = await api.get("/auth/me");
                setUser(userRes.data.data);
            } catch {
                setUser(null);
                setAccessToken(null);
            } finally {
                setIsLoading(false);
            }
        }
        
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.post("/auth/login", { email, password });
        const { user: userData, accessToken } = res.data.data;
        // Refresh token is set as httpOnly cookie by server
        setUser(userData);
        setAccessToken(accessToken);
    };

    const register = async (email: string, password: string, phone?: string) => {
        const res = await api.post("/auth/register", { email, password, phone });
        const { user: userData, accessToken } = res.data.data;
        // Refresh token is set as httpOnly cookie by server
        setUser(userData);
        setAccessToken(accessToken);
    };

    const logout = () => {
        // Fire-and-forget logout to server (clears httpOnly cookie)
        api.post("/auth/logout", {}).catch(() => {});
        setUser(null);
        setAccessToken(null);
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

export { getErrorMessage };

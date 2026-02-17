"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import api, { getErrorMessage } from "@/lib/api";

interface User {
    id: string;
    email: string;
    phone?: string | null;
    telegramChatId?: string | null;
    plan: string;
    planExpiresAt: string | null;
    notifyEmail?: boolean;
    notifyTelegram?: boolean;
    notifySms?: boolean;
    notifyFcm?: boolean;
    createdAt?: string;
    _count?: { alerts: number };
}

interface AuthContextType {
    user: User | null;
    token: string | null;
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
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const res = await api.get("/auth/me");
            setUser(res.data.data);
        } catch {
            setUser(null);
            setToken(null);
            localStorage.removeItem("rdv_token");
            localStorage.removeItem("rdv_user");
        }
    }, []);

    // On mount: check for saved token
    useEffect(() => {
        const savedToken = localStorage.getItem("rdv_token");
        if (savedToken) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setToken(savedToken);
            refreshUser().finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [refreshUser]);

    const login = async (email: string, password: string) => {
        const res = await api.post("/auth/login", { email, password });
        const { user: userData, token: newToken } = res.data.data;
        setUser(userData);
        setToken(newToken);
        localStorage.setItem("rdv_token", newToken);
        localStorage.setItem("rdv_user", JSON.stringify(userData));
    };

    const register = async (email: string, password: string, phone?: string) => {
        const res = await api.post("/auth/register", { email, password, phone });
        const { user: userData, token: newToken } = res.data.data;
        setUser(userData);
        setToken(newToken);
        localStorage.setItem("rdv_token", newToken);
        localStorage.setItem("rdv_user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("rdv_token");
        localStorage.removeItem("rdv_user");
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!user && !!token,
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

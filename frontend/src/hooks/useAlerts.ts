"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";

export interface Alert {
    id: string;
    prefectureId: string;
    procedure: string;
    isActive: boolean;
    slotsFound: number;
    notificationsSent: number;
    lastCheckedAt: string | null;
    createdAt: string;
    prefecture?: {
        name: string;
        department: string;
    };
}

export function useAlerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/alerts");
            setAlerts(res.data.data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to fetch alerts";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const createAlert = async (prefectureId: string, procedure: string) => {
        const res = await api.post("/alerts", { prefectureId, procedure });
        const newAlert = res.data.data;
        setAlerts((prev) => [newAlert, ...prev]);
        return newAlert;
    };

    const toggleAlert = async (alertId: string, isActive: boolean) => {
        const res = await api.patch(`/alerts/${alertId}/toggle`, { isActive });
        setAlerts((prev) =>
            prev.map((a) => (a.id === alertId ? { ...a, isActive: res.data.data.isActive } : a))
        );
    };

    const deleteAlert = async (alertId: string) => {
        await api.delete(`/alerts/${alertId}`);
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    };

    const activeAlerts = alerts.filter((a) => a.isActive);
    const totalSlotsFound = alerts.reduce((sum, a) => sum + a.slotsFound, 0);

    return {
        alerts,
        activeAlerts,
        totalSlotsFound,
        loading,
        error,
        fetchAlerts,
        createAlert,
        toggleAlert,
        deleteAlert,
    };
}

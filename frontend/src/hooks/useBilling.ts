"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";

export interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    duration: string;
    maxAlerts: number | string;
    channels: string[];
    checkInterval: number;
    type: string;
}

export interface Payment {
    id: string;
    plan: string;
    amount: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
    stripePaymentId: string;
}

export function useBilling() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPlans = useCallback(async () => {
        try {
            const res = await api.get("/billing/plans");
            setPlans(res.data.data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to fetch plans";
            setError(msg);
        }
    }, []);

    const fetchPaymentHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/billing/history");
            setPayments(res.data.data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to fetch payments";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const checkout = async (plan: string) => {
        const res = await api.post("/billing/checkout", { plan });
        const { checkoutUrl } = res.data.data;
        if (checkoutUrl) {
            window.location.href = checkoutUrl;
        }
        return res.data.data;
    };

    const cancelSubscription = async () => {
        const res = await api.post("/billing/cancel");
        return res.data.data;
    };

    return {
        plans,
        payments,
        loading,
        error,
        fetchPlans,
        fetchPaymentHistory,
        checkout,
        cancelSubscription,
    };
}

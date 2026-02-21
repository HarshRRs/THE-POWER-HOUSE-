"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";

interface DashboardStats {
    users: { total: number; activeSubscribers: number; newThisWeek: number; byPlan: Record<string, number> };
    alerts: { total: number; active: number };
    detections: { today: number; thisWeek: number };
    revenue: { total: number; thisMonth: number };
    scraper: { activePrefectures: number; erroredPrefectures: number; queueStats: { active: number; waiting: number; failed: number } };
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/admin/dashboard");
            setStats(res.data.data);
            setError("");
        } catch {
            setError("Impossible de charger les statistiques");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [fetchStats]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-sm font-bold text-red-600">{error || "Erreur de chargement"}</p>
                <button onClick={fetchStats} className="mt-3 text-sm font-bold text-primary hover:underline">Reessayer</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-black text-gray-900">Tableau de Bord Admin</h1>
                <span className="text-xs text-gray-400">Actualisation auto. 30s</span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="👥" label="Utilisateurs" value={stats.users.total} sub={`${stats.users.activeSubscribers} abonnes actifs`} color="blue" />
                <StatCard icon="🚨" label="Alertes actives" value={stats.alerts.active} sub={`${stats.alerts.total} total`} color="amber" />
                <StatCard icon="🎯" label="Detections 24h" value={stats.detections.today} sub={`${stats.detections.thisWeek} cette semaine`} color="green" />
                <StatCard icon="💰" label="Revenu ce mois" value={`${(stats.revenue.thisMonth / 100).toFixed(0)}€`} sub={`${(stats.revenue.total / 100).toFixed(0)}€ total`} color="purple" />
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scraper Health */}
                <div className="bg-white rounded-xl p-6 card-shadow border border-gray-100">
                    <h2 className="text-sm font-black text-gray-900 uppercase mb-4">Sante du Scraper</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Prefectures actives</span>
                            <span className="text-sm font-bold text-green-600">{stats.scraper.activePrefectures}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Prefectures en erreur</span>
                            <span className="text-sm font-bold text-red-600">{stats.scraper.erroredPrefectures}</span>
                        </div>
                        <hr className="border-gray-100" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Jobs actifs</span>
                            <StatusBadge status={`${stats.scraper.queueStats.active} ACTIVE`} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Jobs en attente</span>
                            <span className="text-sm font-bold text-amber-600">{stats.scraper.queueStats.waiting}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Jobs echoues</span>
                            <span className={`text-sm font-bold ${stats.scraper.queueStats.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>{stats.scraper.queueStats.failed}</span>
                        </div>
                    </div>
                </div>

                {/* Plan Breakdown */}
                <div className="bg-white rounded-xl p-6 card-shadow border border-gray-100">
                    <h2 className="text-sm font-black text-gray-900 uppercase mb-4">Repartition des Plans</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Nouveaux cette semaine</span>
                            <span className="text-sm font-bold text-blue-600">+{stats.users.newThisWeek}</span>
                        </div>
                        <hr className="border-gray-100" />
                        {Object.entries(stats.users.byPlan).map(([plan, count]) => (
                            <div key={plan} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{plan.replace(/_/g, ' ')}</span>
                                <span className="text-sm font-bold text-gray-900">{count}</span>
                            </div>
                        ))}
                        {Object.keys(stats.users.byPlan).length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-2">Aucun abonne</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

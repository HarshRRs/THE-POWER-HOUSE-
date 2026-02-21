"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import StatusBadge from "@/components/admin/StatusBadge";

interface Prefecture {
    id: string;
    name: string;
    department: string;
    region: string;
    tier: number;
    status: string;
    checkInterval: number;
    lastScrapedAt: string | null;
    lastSlotFoundAt: string | null;
    consecutiveErrors: number;
    bookingUrl: string;
    _count: { alerts: number; detections: number };
}

export default function AdminPrefecturesPage() {
    const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");

    const fetchPrefectures = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== "ALL") params.set("status", statusFilter);
            const res = await api.get(`/admin/prefectures?${params}`);
            setPrefectures(res.data.data);
        } catch {
            // Handle error
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchPrefectures(); }, [fetchPrefectures]);

    const handleResetErrors = async (id: string) => {
        try {
            await api.patch(`/admin/prefectures/${id}`, { consecutiveErrors: 0, status: "ACTIVE" });
            fetchPrefectures();
        } catch {
            // Handle error
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
        try {
            await api.patch(`/admin/prefectures/${id}`, { status: newStatus });
            fetchPrefectures();
        } catch {
            // Handle error
        }
    };

    const filtered = search
        ? prefectures.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.department.includes(search))
        : prefectures;

    const statusTabs = ["ALL", "ACTIVE", "PAUSED", "ERROR", "CAPTCHA"];

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-black text-gray-900">Gestion des Prefectures</h1>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
                {statusTabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === tab ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                        {tab === "ALL" ? "Toutes" : tab} ({tab === "ALL" ? prefectures.length : prefectures.filter((p) => p.status === tab).length})
                    </button>
                ))}
            </div>

            {/* Search */}
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou departement..."
                className="w-full max-w-md px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-white"
            />

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((p) => (
                        <div key={p.id} className="bg-white rounded-xl p-4 card-shadow border border-gray-100">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">{p.name}</h3>
                                    <p className="text-xs text-gray-400">{p.department} - {p.region}</p>
                                </div>
                                <StatusBadge status={p.status} />
                            </div>

                            <div className="space-y-1.5 text-xs text-gray-500">
                                <div className="flex justify-between">
                                    <span>Tier</span>
                                    <span className="font-bold">{p.tier}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Alertes</span>
                                    <span className="font-bold">{p._count.alerts}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Detections</span>
                                    <span className="font-bold">{p._count.detections}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Intervalle</span>
                                    <span className="font-bold">{p.checkInterval}s</span>
                                </div>
                                {p.consecutiveErrors > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Erreurs consec.</span>
                                        <span className="font-bold">{p.consecutiveErrors}</span>
                                    </div>
                                )}
                                {p.lastScrapedAt && (
                                    <div className="flex justify-between">
                                        <span>Dernier scan</span>
                                        <span className="font-bold">{new Date(p.lastScrapedAt).toLocaleTimeString("fr-FR")}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => handleToggleStatus(p.id, p.status)}
                                    className="flex-1 text-[11px] font-bold py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                                >
                                    {p.status === "ACTIVE" ? "Pause" : "Activer"}
                                </button>
                                {p.consecutiveErrors > 0 && (
                                    <button
                                        onClick={() => handleResetErrors(p.id)}
                                        className="flex-1 text-[11px] font-bold py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                                    >
                                        Reset erreurs
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

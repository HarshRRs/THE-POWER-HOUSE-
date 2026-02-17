"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { useAlerts, type Alert } from "@/hooks/useAlerts";
import api from "@/lib/api";

interface Detection {
    id: string;
    prefectureName?: string;
    department?: string;
    slotsAvailable: number;
    createdAt: string;
    prefecture?: { name: string; department: string };
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { alerts, activeAlerts, totalSlotsFound, fetchAlerts, loading: alertsLoading } = useAlerts();
    const [detections, setDetections] = useState<Detection[]>([]);
    const [detectionsLoading, setDetectionsLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
        fetchDetections();
    }, [fetchAlerts]);

    const fetchDetections = async () => {
        try {
            const res = await api.get("/users/detections?limit=10");
            setDetections(res.data.data || []);
        } catch {
            /* silent */
        } finally {
            setDetectionsLoading(false);
        }
    };

    const totalNotifications = alerts.reduce((sum, a) => sum + a.notificationsSent, 0);
    const nextCheckLabel = user?.plan === "URGENCE_TOTAL" ? "30s" : user?.plan === "URGENCE_7J" ? "60s" : "2min";

    const stats = [
        { icon: "🚨", label: "Alertes actives", value: activeAlerts.length, color: "text-accent" },
        { icon: "✅", label: "Créneaux trouvés", value: totalSlotsFound, color: "text-success" },
        { icon: "📩", label: "Notifications", value: totalNotifications, color: "text-primary" },
        { icon: "⏱️", label: "Fréq. vérif.", value: nextCheckLabel, color: "text-warning" },
    ];

    function timeAgo(d: string) {
        const ms = Date.now() - new Date(d).getTime();
        const m = Math.floor(ms / 60000);
        if (m < 1) return "à l'instant";
        if (m < 60) return `il y a ${m}min`;
        const h = Math.floor(m / 60);
        if (h < 24) return `il y a ${h}h`;
        return `il y a ${Math.floor(h / 24)}j`;
    }

    return (
        <div className="space-y-6">
            {/* Urgent banner — show if recent detections exist */}
            {detections.length > 0 && (
                <div className="bg-accent text-white rounded-xl p-4 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-3">
                        <span className="text-xl animate-urgent-blink">🔴</span>
                        <div>
                            <p className="text-sm font-bold">{detections.length} créneau(x) détecté(s) récemment</p>
                            <p className="text-xs opacity-80">Vérifiez vos alertes — les places partent vite</p>
                        </div>
                    </div>
                    <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg">Voir →</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((s) => (
                    <div key={s.label} className="bg-white rounded-xl card-shadow p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{s.icon}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</span>
                        </div>
                        <p className={`text-2xl font-black ${s.color}`}>
                            {alertsLoading ? (
                                <span className="inline-block w-10 h-7 bg-gray-100 rounded animate-pulse" />
                            ) : s.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Active Alerts */}
            <section>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    🚨 Alertes actives <span className="text-xs font-normal text-gray-400">({activeAlerts.length})</span>
                </h2>
                {alertsLoading ? (
                    <div className="space-y-2">
                        {[1, 2].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
                    </div>
                ) : activeAlerts.length === 0 ? (
                    <div className="bg-white rounded-xl card-shadow p-8 text-center">
                        <p className="text-3xl mb-2">🏛️</p>
                        <p className="text-sm font-bold text-gray-900">Aucune alerte active</p>
                        <p className="text-xs text-gray-400 mt-1">Créez votre première alerte pour commencer la surveillance</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {activeAlerts.map((alert: Alert) => (
                            <div key={alert.id} className="bg-white rounded-xl card-shadow p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-light text-primary rounded-xl flex items-center justify-center text-xs font-black">
                                        {alert.prefecture?.department || "?"}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">{alert.prefecture?.name || "Préfecture"}</h3>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{alert.procedure.replace(/_/g, " ")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-success bg-success-light px-2 py-1 rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse-slow" />
                                        Active
                                    </span>
                                    {alert.slotsFound > 0 && (
                                        <span className="text-[10px] font-bold text-accent bg-accent-light px-2 py-1 rounded-full">
                                            {alert.slotsFound} ✅
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Recent Detections */}
            <section>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    📡 Détections récentes
                </h2>
                {detectionsLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-white rounded-xl animate-pulse" />)}
                    </div>
                ) : detections.length === 0 ? (
                    <div className="bg-white rounded-xl card-shadow p-6 text-center">
                        <p className="text-sm text-gray-400">Aucune détection pour le moment — la surveillance est en cours</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {detections.map((d) => (
                            <div key={d.id} className="bg-white rounded-xl card-shadow p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-success rounded-full flex-shrink-0 animate-pulse-slow" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{d.prefecture?.name || d.prefectureName || "Préfecture"}</p>
                                        <p className="text-[10px] text-gray-400">{timeAgo(d.createdAt)}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-success bg-success-light px-2.5 py-1 rounded-full">
                                    {d.slotsAvailable} créneau(x)
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

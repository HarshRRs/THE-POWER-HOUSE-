"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────
interface KpiStats {
    detectionsToday: number;
    activeClients: number;
    whatsappSentToday: number;
    activePrefectures: number;
    totalPrefectures: number;
}

interface LiveRow {
    target: string;
    department?: string;
    category: string;
    lastChecked: string;
    status: "ACTIVE" | "ERROR" | "PAUSED";
    slotsFound: number;
}

interface Detection {
    id: string;
    target: string;
    category: string;
    slots: number;
    detectedAt: string;
    whatsappSent: boolean;
}

// ─── Sub-Components ───────────────────────────────
function KpiCard({
    icon, label, value, sub, color,
}: { icon: string; label: string; value: string | number; sub: string; color: string }) {
    const colors: Record<string, string> = {
        sky: "border-sky-400 bg-sky-50 text-sky-600",
        blue: "border-blue-400 bg-blue-50 text-blue-600",
        green: "border-green-400 bg-green-50 text-green-600",
        purple: "border-purple-400 bg-purple-50 text-purple-600",
    };
    return (
        <div className={`bg-white rounded-2xl p-5 border-t-4 shadow-sm hover:shadow-md transition-shadow ${colors[color].split(" ")[0]}`}>
            <div className={`w-10 h-10 rounded-xl ${colors[color].split(" ").slice(1).join(" ")} flex items-center justify-center text-xl mb-3`}>
                {icon}
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
            <p className="text-[11px] text-gray-400 mt-2 font-medium">{sub}</p>
        </div>
    );
}

function StatusDot({ status }: { status: "ACTIVE" | "ERROR" | "PAUSED" }) {
    if (status === "ACTIVE")
        return <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-xs font-semibold text-green-600">Actif</span></span>;
    if (status === "ERROR")
        return <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs font-semibold text-red-500">Erreur</span></span>;
    return <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300" /><span className="text-xs font-semibold text-gray-400">Pausé</span></span>;
}

// Mock data (will be replaced by API calls once backend endpoints are added)
const MOCK_LIVE: LiveRow[] = [
    { target: "Paris 75", department: "75", category: "Carte ID / Passeport", lastChecked: "Il y a 2 min", status: "ACTIVE", slotsFound: 0 },
    { target: "Bobigny 93", department: "93", category: "Titre Séjour / Naturalisation", lastChecked: "Il y a 1 min", status: "ACTIVE", slotsFound: 0 },
    { target: "Créteil 94", department: "94", category: "Renouvellement salarié", lastChecked: "Il y a 3 min", status: "ACTIVE", slotsFound: 2 },
    { target: "Nanterre 92", department: "92", category: "Titre Séjour", lastChecked: "Il y a 2 min", status: "ACTIVE", slotsFound: 0 },
    { target: "Évry 91", department: "91", category: "Vie privée & familiale", lastChecked: "Il y a 3 min", status: "ACTIVE", slotsFound: 0 },
    { target: "Cergy 95", department: "95", category: "Titre Séjour G1 / G2", lastChecked: "Il y a 2 min", status: "ACTIVE", slotsFound: 0 },
    { target: "Melun 77", department: "77", category: "Première demande", lastChecked: "Il y a 3 min", status: "ACTIVE", slotsFound: 0 },
    { target: "Versailles 78", department: "78", category: "Renouvellement étudiant", lastChecked: "Il y a 1 min", status: "ACTIVE", slotsFound: 0 },
    { target: "Lyon 69", department: "69", category: "Titre Séjour / Naturalisation", lastChecked: "Il y a 3 min", status: "ACTIVE", slotsFound: 0 },
    { target: "Moulins 03", department: "03", category: "Titre Séjour", lastChecked: "Il y a 2 min", status: "ACTIVE", slotsFound: 0 },
    { target: "🇮🇳 Ambassade Inde", category: "Passeport / OCI", lastChecked: "Il y a 1 min", status: "ACTIVE", slotsFound: 0 },
    { target: "🇮🇳 Ambassade Inde", category: "Visa / Naissance", lastChecked: "Il y a 3 min", status: "ACTIVE", slotsFound: 0 },
];

const MOCK_DETECTIONS: Detection[] = [
    { id: "1", target: "Créteil 94", category: "Renouvellement salarié", slots: 2, detectedAt: "Il y a 12 min", whatsappSent: true },
    { id: "2", target: "Paris 75", category: "Passeport", slots: 1, detectedAt: "Il y a 1h 20min", whatsappSent: true },
    { id: "3", target: "Nanterre 92", category: "Vie privée & familiale", slots: 3, detectedAt: "Hier 22:05", whatsappSent: false },
    { id: "4", target: "🇮🇳 Ambassade Inde", category: "OCI Services", slots: 1, detectedAt: "Hier 14:30", whatsappSent: true },
    { id: "5", target: "Lyon 69", category: "Naturalisation", slots: 2, detectedAt: "Il y a 2 jours", whatsappSent: true },
];

export default function BossDashboard() {
    const [kpis, setKpis] = useState<KpiStats>({
        detectionsToday: 47,
        activeClients: 23,
        whatsappSentToday: 18,
        activePrefectures: 10,
        totalPrefectures: 10,
    });
    const [liveRows] = useState<LiveRow[]>(MOCK_LIVE);
    const [detections] = useState<Detection[]>(MOCK_DETECTIONS);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/admin/dashboard");
            const s = res.data.data;
            setKpis({
                detectionsToday: s.detections?.today ?? kpis.detectionsToday,
                activeClients: s.alerts?.active ?? kpis.activeClients,
                whatsappSentToday: kpis.whatsappSentToday,
                activePrefectures: s.scraper?.activePrefectures ?? kpis.activePrefectures,
                totalPrefectures: 10,
            });
            setLastRefresh(new Date());
        } catch { /* use mock data if API fails */ }
    }, [kpis]);

    useEffect(() => {
        fetchStats();
        const t = setInterval(fetchStats, 30000);
        return () => clearInterval(t);
    }, [fetchStats]);

    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Tableau de Bord</h1>
                    <p className="text-sm text-gray-400 mt-0.5 capitalize">{dateStr}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400">Actualisé à {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Système actif
                    </span>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon="🎯" label="Créneaux détectés" value={kpis.detectionsToday} sub="Aujourd'hui • +12 depuis hier" color="sky" />
                <KpiCard icon="👥" label="Clients actifs" value={kpis.activeClients} sub="Alertes en cours" color="blue" />
                <KpiCard icon="💬" label="WhatsApp envoyés" value={kpis.whatsappSentToday} sub="Aujourd'hui" color="green" />
                <KpiCard icon="✅" label="Préfectures actives" value={`${kpis.activePrefectures}/${kpis.totalPrefectures}`} sub="Toutes opérationnelles" color="purple" />
            </div>

            {/* ── Two Column Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Live Surveillance Table */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 bg-sky-500">
                        <h2 className="text-sm font-black text-white uppercase tracking-wide">
                            🔴 Surveillance en Direct
                        </h2>
                        <span className="text-xs text-sky-100">{liveRows.length} cibles</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-sky-50">
                                    <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Cible</th>
                                    <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Catégorie</th>
                                    <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase hidden sm:table-cell">Il y a</th>
                                    <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Statut</th>
                                    <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Créneaux</th>
                                </tr>
                            </thead>
                            <tbody>
                                {liveRows.map((row, i) => (
                                    <tr key={i} className={`border-b border-gray-50 transition-colors hover:bg-sky-50/50 ${row.slotsFound > 0 ? "bg-sky-50" : ""}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-800 text-sm">{row.target}</div>
                                            {row.department && <div className="text-[10px] text-gray-400">Dept. {row.department}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">{row.category}</td>
                                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{row.lastChecked}</td>
                                        <td className="px-4 py-3"><StatusDot status={row.status} /></td>
                                        <td className="px-4 py-3 text-right">
                                            {row.slotsFound > 0 ? (
                                                <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 bg-sky-500 text-white text-xs font-black rounded-full animate-pulse">
                                                    {row.slotsFound}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Detections Feed */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-sky-100 flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Détections Récentes</h2>
                        <Link href="/dashboard/admin/boss/alertes" className="text-xs text-sky-500 font-semibold hover:underline">
                            Voir tout →
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {detections.map((d) => (
                            <div key={d.id} className="px-5 py-4 hover:bg-sky-50/40 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="w-1 h-full self-stretch min-h-[40px] bg-sky-400 rounded-full flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{d.target}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{d.category}</p>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                                                🎯 {d.slots} créneau{d.slots > 1 ? "x" : ""}
                                            </span>
                                            {d.whatsappSent && (
                                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    💬 WhatsApp ✓
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1.5">{d.detectedAt}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

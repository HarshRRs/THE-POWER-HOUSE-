"use client";

import { useEffect, useState } from "react";
import { usePrefectures, REGIONS, type Prefecture } from "@/hooks/usePrefectures";
import PrefectureCard from "@/components/PrefectureCard";

const statusFilters = ["Toutes", "ACTIVE", "PAUSED", "ERROR", "CAPTCHA"];
const statusLabels: Record<string, string> = {
    Toutes: "Toutes",
    ACTIVE: "🟢 Actives",
    PAUSED: "🟡 En pause",
    ERROR: "🔴 Erreur",
    CAPTCHA: "🟠 CAPTCHA",
};

export default function PrefecturesPage() {
    const {
        filteredPrefectures,
        loading,
        fetchPrefectures,
        searchQuery,
        setSearchQuery,
        selectedRegion,
        setSelectedRegion,
    } = usePrefectures();

    const [statusFilter, setStatusFilter] = useState("Toutes");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    useEffect(() => {
        fetchPrefectures();
    }, [fetchPrefectures]);

    const displayed = statusFilter === "Toutes"
        ? filteredPrefectures
        : filteredPrefectures.filter((p) => p.status === statusFilter);

    const activeCnt = filteredPrefectures.filter((p) => p.status === "ACTIVE").length;
    const errorCnt = filteredPrefectures.filter((p) => p.status === "ERROR").length;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    🏛️ Préfectures
                    <span className="text-xs font-normal text-gray-400">({filteredPrefectures.length})</span>
                </h1>
                <p className="text-xs text-gray-500 mt-1">Statut en temps réel de toutes les préfectures surveillées</p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-3">
                <div className="flex-1 bg-success-light rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-success">{activeCnt}</p>
                    <p className="text-[10px] font-bold text-success/70">Actives</p>
                </div>
                <div className="flex-1 bg-accent-light rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-accent">{errorCnt}</p>
                    <p className="text-[10px] font-bold text-accent/70">Erreurs</p>
                </div>
                <div className="flex-1 bg-primary-light rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-primary">{filteredPrefectures.length}</p>
                    <p className="text-[10px] font-bold text-primary/70">Total</p>
                </div>
            </div>

            {/* Search */}
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Rechercher par nom, département ou région..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-white"
            />

            {/* Region Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {REGIONS.map((r) => (
                    <button
                        key={r}
                        onClick={() => setSelectedRegion(r)}
                        className={`flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${selectedRegion === r ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Status Filters + View Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                    {statusFilters.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-colors ${statusFilter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                        >
                            {statusLabels[s]}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => setViewMode("list")} className={`px-2 py-1 rounded text-[10px] font-bold ${viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}>☰</button>
                    <button onClick={() => setViewMode("grid")} className={`px-2 py-1 rounded text-[10px] font-bold ${viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}>⊞</button>
                </div>
            </div>

            {/* Prefecture List */}
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
                </div>
            ) : displayed.length === 0 ? (
                <div className="bg-white rounded-xl card-shadow p-8 text-center">
                    <p className="text-3xl mb-2">🔍</p>
                    <p className="text-sm font-bold text-gray-900">Aucune préfecture trouvée</p>
                    <p className="text-xs text-gray-400 mt-1">Essayez un autre terme de recherche</p>
                </div>
            ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2"}>
                    {displayed.map((pref: Prefecture) => (
                        <PrefectureCard key={pref.id} prefecture={pref} compact={viewMode === "grid"} />
                    ))}
                </div>
            )}

            {/* Legend */}
            <div className="bg-white rounded-xl card-shadow p-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Légende des statuts</h3>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 bg-success rounded-full" /> Active — Surveillance opérationnelle</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 bg-gray-400 rounded-full" /> En pause — Temporairement arrêtée</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 bg-accent rounded-full" /> Erreur — Site inaccessible</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 bg-warning rounded-full" /> CAPTCHA — Vérification requise</div>
                </div>
            </div>
        </div>
    );
}

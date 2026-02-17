"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth";
import { useAlerts, type Alert } from "@/hooks/useAlerts";
import { usePrefectures, REGIONS, type Prefecture } from "@/hooks/usePrefectures";
import { getErrorMessage } from "@/lib/api";
import Toast from "@/components/Toast";

const PROCEDURES = [
    { value: "TITRE_SEJOUR_PREMIERE", label: "Titre de séjour — 1ère demande" },
    { value: "TITRE_SEJOUR_RENOUVELLEMENT", label: "Titre de séjour — Renouvellement" },
    { value: "NATURALISATION", label: "Naturalisation" },
    { value: "VISA_LONG_SEJOUR", label: "Visa long séjour" },
    { value: "CARTE_IDENTITE", label: "Carte d'identité" },
    { value: "PASSEPORT", label: "Passeport" },
    { value: "PERMIS_CONDUIRE", label: "Permis de conduire" },
    { value: "AUTRE", label: "Autre" },
];

const PLAN_LIMITS: Record<string, number> = {
    URGENCE_24H: 1,
    URGENCE_7J: 3,
    URGENCE_TOTAL: 999,
    FREE: 0,
};

export default function AlertsPage() {
    const { user } = useAuth();
    const { alerts, fetchAlerts, createAlert, toggleAlert, deleteAlert, loading: alertsLoading } = useAlerts();
    const { filteredPrefectures, fetchPrefectures, searchQuery, setSearchQuery, selectedRegion, setSelectedRegion, loading: prefLoading } = usePrefectures();

    const [showModal, setShowModal] = useState(false);
    const [selectedPrefecture, setSelectedPrefecture] = useState<Prefecture | null>(null);
    const [selectedProcedure, setSelectedProcedure] = useState(PROCEDURES[0].value);
    const [creating, setCreating] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchAlerts();
        fetchPrefectures();
    }, [fetchAlerts, fetchPrefectures]);

    const maxAlerts = PLAN_LIMITS[user?.plan || "FREE"] || 0;
    const alertsUsed = alerts.length;
    const canCreate = alertsUsed < maxAlerts;

    const handleCreate = useCallback(async () => {
        if (!selectedPrefecture) return;
        setCreating(true);
        try {
            await createAlert(selectedPrefecture.id, selectedProcedure);
            setShowModal(false);
            setSelectedPrefecture(null);
            setToast({ message: `Alerte créée pour ${selectedPrefecture.name} !`, type: "success" });
        } catch (err) {
            setToast({ message: getErrorMessage(err), type: "error" });
        } finally {
            setCreating(false);
        }
    }, [selectedPrefecture, selectedProcedure, createAlert]);

    const handleToggle = useCallback(async (alert: Alert) => {
        try {
            await toggleAlert(alert.id, !alert.isActive);
        } catch (err) {
            setToast({ message: getErrorMessage(err), type: "error" });
        }
    }, [toggleAlert]);

    const handleDelete = useCallback(async (id: string) => {
        setDeletingId(id);
        try {
            await deleteAlert(id);
            setToast({ message: "Alerte supprimée", type: "success" });
        } catch (err) {
            setToast({ message: getErrorMessage(err), type: "error" });
        } finally {
            setDeletingId(null);
        }
    }, [deleteAlert]);

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Plan Limit Banner */}
            <div className={`rounded-xl p-4 flex items-center justify-between ${canCreate ? "bg-primary-light" : "bg-warning-light"}`}>
                <div className="flex items-center gap-2">
                    <span className="text-base">{canCreate ? "📊" : "⚠️"}</span>
                    <p className="text-xs font-bold text-gray-800">
                        {alertsUsed} / {maxAlerts === 999 ? "∞" : maxAlerts} alertes utilisées
                        {!canCreate && " — Upgradez votre plan"}
                    </p>
                </div>
                <button
                    onClick={() => canCreate ? setShowModal(true) : undefined}
                    disabled={!canCreate}
                    className="gradient-urgent text-white text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                    + Nouvelle alerte
                </button>
            </div>

            {/* Active Alerts List */}
            <section>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-3">
                    🚨 Vos alertes ({alerts.length})
                </h2>

                {alertsLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="bg-white rounded-2xl card-shadow p-10 text-center">
                        <p className="text-4xl mb-3">🏛️</p>
                        <p className="text-sm font-bold text-gray-900">Aucune alerte configurée</p>
                        <p className="text-xs text-gray-400 mt-2">Créez votre première alerte pour commencer la surveillance de créneaux</p>
                        <button onClick={() => setShowModal(true)} disabled={!canCreate} className="mt-4 gradient-urgent text-white text-xs font-bold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50">
                            🚨 Créer ma première alerte
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {alerts.map((alert) => (
                            <div key={alert.id} className={`bg-white rounded-xl card-shadow p-4 transition-all ${deletingId === alert.id ? "opacity-50" : ""}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-11 h-11 bg-primary-light text-primary rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0">
                                            {alert.prefecture?.department || "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 truncate">{alert.prefecture?.name || "Préfecture"}</h3>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{PROCEDURES.find(p => p.value === alert.procedure)?.label || alert.procedure}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {alert.slotsFound > 0 && (
                                            <span className="text-[10px] font-bold text-success bg-success-light px-2 py-1 rounded-full">{alert.slotsFound} ✅</span>
                                        )}
                                        <button
                                            onClick={() => handleToggle(alert)}
                                            className={`w-12 h-6 rounded-full p-0.5 transition-colors ${alert.isActive ? "bg-success" : "bg-gray-300"}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${alert.isActive ? "translate-x-6" : "translate-x-0"}`} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(alert.id)}
                                            className="text-gray-300 hover:text-accent text-sm transition-colors p-1"
                                            title="Supprimer"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Create Alert Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                            <h2 className="text-lg font-black text-gray-900">🚨 Nouvelle alerte</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>

                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            {/* Region Filters */}
                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
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

                            {/* Prefecture Search */}
                            <div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="🔍 Rechercher une préfecture (nom, n° département)..."
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                                />
                            </div>

                            {/* Prefecture List */}
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {prefLoading ? (
                                    <div className="text-center py-4">
                                        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                                    </div>
                                ) : filteredPrefectures.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-4">Aucune préfecture trouvée</p>
                                ) : (
                                    filteredPrefectures.map((pref) => (
                                        <button
                                            key={pref.id}
                                            onClick={() => setSelectedPrefecture(pref)}
                                            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${selectedPrefecture?.id === pref.id ? "bg-primary-light ring-2 ring-primary" : "hover:bg-gray-50"}`}
                                        >
                                            <span className="w-9 h-9 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0">
                                                {pref.department}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{pref.name}</p>
                                                <p className="text-[10px] text-gray-400">{pref.region}</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Procedure Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">Type de procédure</label>
                                <select
                                    value={selectedProcedure}
                                    onChange={(e) => setSelectedProcedure(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                                >
                                    {PROCEDURES.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 flex-shrink-0">
                            <button
                                onClick={handleCreate}
                                disabled={!selectedPrefecture || creating}
                                className="w-full gradient-urgent text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-accent/20 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {creating ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Création...
                                    </span>
                                ) : (
                                    `🚨 Activer la surveillance ${selectedPrefecture ? `— ${selectedPrefecture.name}` : ""}`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

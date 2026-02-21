"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth";
import { useBilling, type Payment } from "@/hooks/useBilling";
import { getErrorMessage } from "@/lib/api";
import CountdownTimer from "@/components/CountdownTimer";
import Toast from "@/components/Toast";

const PLAN_NAMES: Record<string, string> = {
    URGENCE_24H: "Urgence 24h",
    URGENCE_7J: "Urgence 7 jours",
    URGENCE_TOTAL: "Urgence Totale",
    FREE: "Essai gratuit",
};

const PLAN_FEATURES: Record<string, string[]> = {
    URGENCE_24H: ["1 alerte active", "Vérification toutes les 2 min", "Email & navigateur"],
    URGENCE_7J: ["3 alertes actives", "Vérification toutes les 60s", "Email, Telegram, navigateur"],
    URGENCE_TOTAL: ["Alertes illimitées", "Vérification toutes les 30s", "Tous les canaux (Email, SMS, Telegram, Push)"],
};

export default function BillingPage() {
    const { user, refreshUser } = useAuth();
    const { payments, fetchPaymentHistory, checkout, cancelSubscription, loading } = useBilling();
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        fetchPaymentHistory();

        // Handle Stripe redirect
        const paymentStatus = searchParams.get("payment");
        if (paymentStatus === "success") {
            setToast({ message: "Paiement réussi ! Votre plan est maintenant actif 🎉", type: "success" });
            refreshUser();
        } else if (paymentStatus === "cancelled") {
            setToast({ message: "Paiement annulé", type: "info" });
        }
    }, [fetchPaymentHistory, searchParams, refreshUser]);

    const handleUpgrade = async (plan: string) => {
        try {
            await checkout(plan);
        } catch (err) {
            setToast({ message: getErrorMessage(err), type: "error" });
        }
    };

    const handleCancel = async () => {
        if (!confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) return;
        setCancelling(true);
        try {
            await cancelSubscription();
            setToast({ message: "Abonnement annulé", type: "success" });
            refreshUser();
        } catch (err) {
            setToast({ message: getErrorMessage(err), type: "error" });
        } finally {
            setCancelling(false);
        }
    };

    const planName = PLAN_NAMES[user?.plan || "FREE"] || user?.plan || "—";
    const planFeatures = PLAN_FEATURES[user?.plan || "FREE"] || [];
    const isActive = user?.plan !== "FREE" && user?.planExpiresAt;

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Current Plan */}
            <div className="bg-white rounded-2xl card-shadow overflow-hidden">
                <div className="gradient-primary p-5 sm:p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Votre plan actif</p>
                            <h2 className="text-lg sm:text-xl font-black mt-1">🔥 {planName}</h2>
                        </div>
                        {isActive && (
                            <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-slow" /> Actif
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-5 sm:p-6">
                    <CountdownTimer expiresAt={user?.planExpiresAt || null} />

                    {planFeatures.length > 0 && (
                        <ul className="mt-4 space-y-2">
                            {planFeatures.map((f) => (
                                <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-success">✓</span> {f}
                                </li>
                            ))}
                        </ul>
                    )}

                    {isActive && user?.plan !== "URGENCE_TOTAL" && (
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => handleUpgrade("URGENCE_TOTAL")} className="flex-1 gradient-urgent text-white text-xs font-bold py-3 rounded-xl hover:opacity-90 btn-press">
                                ⬆️ Passer à Urgence Totale
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Upgrade Plans */}
            {(!isActive || user?.plan === "FREE") && (
                <section>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-3">💳 Choisir un plan</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { id: "URGENCE_24H", name: "Urgence 24h", price: "4,99€", period: "24 heures", features: PLAN_FEATURES.URGENCE_24H },
                            { id: "URGENCE_7J", name: "Urgence 7 jours", price: "14,99€", period: "7 jours", features: PLAN_FEATURES.URGENCE_7J, badge: "POPULAIRE" },
                            { id: "URGENCE_TOTAL", name: "Urgence Totale", price: "29,99€/mois", period: "mensuel", features: PLAN_FEATURES.URGENCE_TOTAL },
                        ].map((p) => (
                            <div key={p.id} className={`bg-white rounded-xl card-shadow p-5 relative ${p.badge ? "ring-2 ring-accent" : ""}`}>
                                {p.badge && <span className="absolute -top-2.5 left-4 emergency-badge px-3 py-1 rounded-full text-[10px] font-bold">{p.badge}</span>}
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">{p.name}</h3>
                                        <p className="text-[10px] text-gray-400">{p.period}</p>
                                    </div>
                                    <p className="text-lg font-black text-accent">{p.price}</p>
                                </div>
                                <ul className="space-y-1.5 mb-4">
                                    {p.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-[11px] text-gray-600">
                                            <span className="text-success">✓</span> {f}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => handleUpgrade(p.id)} className="w-full gradient-urgent text-white text-xs font-bold py-3 rounded-xl hover:opacity-90 btn-press">
                                    Choisir ce plan
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Payment History */}
            <section>
                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full text-left">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">🧾 Historique des paiements</h2>
                    <span className="text-gray-400 text-xs">{showHistory ? "Masquer" : "Voir"} →</span>
                </button>

                {showHistory && (
                    <div className="mt-3 space-y-2">
                        {loading ? (
                            <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 bg-white rounded-xl animate-pulse" />)}</div>
                        ) : payments.length === 0 ? (
                            <p className="text-xs text-gray-400 bg-white rounded-xl p-4 text-center">Aucun paiement pour le moment</p>
                        ) : (
                            payments.map((p: Payment) => (
                                <div key={p.id} className="bg-white rounded-xl card-shadow p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{PLAN_NAMES[p.plan] || p.plan}</p>
                                        <p className="text-[10px] text-gray-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("fr-FR") : "—"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{(p.amount / 100).toFixed(2)}€</p>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.status === "COMPLETED" ? "bg-success-light text-success" : "bg-warning-light text-warning"
                                            }`}>{p.status === "COMPLETED" ? "Payé" : "En attente"}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>

            {/* Cancel */}
            {isActive && (
                <button onClick={handleCancel} disabled={cancelling} className="text-xs text-gray-400 hover:text-accent font-semibold transition-colors py-2">
                    {cancelling ? "Annulation..." : "Annuler mon abonnement"}
                </button>
            )}
        </div>
    );
}

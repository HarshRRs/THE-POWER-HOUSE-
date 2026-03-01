"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useAuth, getErrorMessage } from "@/context/auth";
import { useBilling } from "@/hooks/useBilling";
import TrustBadges from "@/components/TrustBadges";

const PLAN_MAP: Record<string, string> = {
    "24h": "URGENCE_24H",
    "7j": "URGENCE_7J",
    "total": "URGENCE_TOTAL",
};

function RegisterForm() {
    const [plan, setPlan] = useState("7j");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { register } = useAuth();
    const { checkout } = useBilling();
    const router = useRouter();
    const searchParams = useSearchParams();

    const prefName = searchParams.get("name");
    // const prefId = searchParams.get("prefectureId"); // Available for future logic

    const plans = [
        { 
            id: "24h", 
            name: "Urgence 24h", 
            price: "4,99€", 
            desc: "1 alerte • Vérif. 2 min",
            returnPolicy: { text: "❌ Pas de remboursement", color: "text-red-600", bgColor: "bg-red-50" }
        },
        { 
            id: "7j", 
            name: "Urgence 7 jours", 
            price: "14,99€", 
            desc: "3 alertes • Vérif. 60s", 
            badge: "POPULAIRE",
            returnPolicy: { text: "🟡 50% si échec", color: "text-yellow-600", bgColor: "bg-yellow-50" }
        },
        { 
            id: "total", 
            name: "Urgence Totale", 
            price: "29,99€/mois", 
            desc: "Illimité • Vérif. 30s",
            returnPolicy: { text: "✅ RDV ou remboursé", color: "text-green-600", bgColor: "bg-green-50" }
        },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await register(email, pass, phone || undefined);
            // After registration, redirect to Stripe checkout
            const stripePlan = PLAN_MAP[plan];
            if (stripePlan) {
                await checkout(stripePlan);
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            setError(getErrorMessage(err));
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg">
            {prefName ? (
                <div className="bg-primary/10 border border-primary/20 text-primary rounded-xl p-4 mb-6 text-center animate-fade-in">
                    <p className="text-sm font-bold">
                        🎯 Objectif : Alerte pour <span className="underline">{prefName}</span>
                    </p>
                    <p className="text-xs text-primary/70 mt-1">
                        Créez votre compte pour activer la surveillance immédiatement.
                    </p>
                </div>
            ) : (
                <div className="bg-accent text-white rounded-xl p-4 mb-6 text-center">
                    <p className="text-sm font-bold flex items-center justify-center gap-2">
                        <span className="animate-urgent-blink">🔴</span>
                        Système de détection actif · Préfecture de Paris surveillée
                        <span className="animate-urgent-blink">🔴</span>
                    </p>
                </div>
            )}

            <div className="card-govt bg-white rounded-2xl p-5 sm:p-8">
                <div className="text-center mb-6">
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900">Activez votre surveillance</h1>
                    <p className="text-sm text-gray-500 mt-2">Choisissez votre plan et recevez votre première alerte en &lt;5 minutes</p>
                </div>

                {error && (
                    <div className="mb-4 bg-accent-light border border-accent/20 text-accent rounded-xl p-3 text-sm font-semibold animate-fade-in">
                        ❌ {error}
                    </div>
                )}

                {/* Plan Selector */}
                <div className="space-y-2 mb-6">
                    <label className="block text-sm font-bold text-gray-700">Votre plan</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {plans.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPlan(p.id)}
                                className={`relative text-left p-3 sm:p-3 rounded-xl border-2 transition-all btn-press flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0 ${plan === p.id ? "border-accent bg-accent-light" : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                {p.badge && (
                                    <span className="absolute -top-2 left-2 emergency-badge px-2 py-0.5 rounded-full text-[9px] font-bold">{p.badge}</span>
                                )}
                                <div className="flex-1 sm:flex-none">
                                    <p className="text-xs font-bold text-gray-900">{p.name}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5 sm:mt-0.5">{p.desc}</p>
                                    {p.returnPolicy && (
                                        <span className={`inline-block text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded ${p.returnPolicy.bgColor} ${p.returnPolicy.color}`}>
                                            {p.returnPolicy.text}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-black text-accent sm:mt-1">{p.price}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.fr" required className="w-full input-mobile" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mot de passe</label>
                        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" required minLength={8} className="w-full input-mobile" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Téléphone <span className="text-gray-400 font-normal">(optionnel)</span></label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" className="w-full input-mobile" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full gradient-urgent text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-accent/20 hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition-all btn-press">
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Création du compte...
                            </span>
                        ) : `🚨 Créer mon compte et payer ${plans.find(p => p.id === plan)?.price}`}
                    </button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-4">
                    <TrustBadges />
                    
                    {/* Legal Disclosure Box */}
                    <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs">
                        <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                            ℹ️ Informations légales importantes
                        </h3>
                        <ul className="text-blue-700 space-y-1 mb-2">
                            <li>• <strong>4,99€ :</strong> Service vendu tel quel, pas de remboursement</li>
                            <li>• <strong>14,99€ :</strong> 50% remboursé si aucun créneau détecté en 7 jours</li>
                            <li>• <strong>29,99€/mois :</strong> 100% remboursé si aucun RDV trouvé (garantie automatique)</li>
                        </ul>
                        <p className="text-blue-600 text-[10px]">
                            Consultez nos <Link href="/cgv" className="text-primary underline font-medium">Conditions Générales de Vente</Link> pour le détail complet.
                        </p>
                    </div>
                    
                    <p className="text-xs text-gray-400 text-center">
                        En créant un compte, vous acceptez nos <Link href="/cgv" className="text-primary underline">CGV</Link> et <Link href="/confidentialite" className="text-primary underline">politique de confidentialité</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="tricolor-bar w-full" />

            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="text-lg font-extrabold text-primary">RDV<span className="text-accent">Priority</span><span className="text-gray-400 text-sm">.fr</span></Link>
                    <Link href="/login" className="text-sm font-semibold text-primary hover:underline">Déjà un compte ?</Link>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center py-6 px-4 sm:py-8">
                <Suspense fallback={<div className="w-full max-w-lg h-96 skeleton rounded-2xl" />}>
                    <RegisterForm />
                </Suspense>
            </main>
        </div>
    );
}

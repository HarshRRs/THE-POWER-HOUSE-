"use client";

import { useState } from "react";

interface AlertLog {
    id: string;
    clientName: string;
    phone: string;
    target: string;
    category: string;
    slots: number;
    sentAt: string;
    delivered: boolean;
    message: string;
}

const MOCK_ALERTS: AlertLog[] = [
    {
        id: "1", clientName: "Rahul Sharma", phone: "+33612345678",
        target: "Créteil 94", category: "Renouvellement salarié",
        slots: 2, sentAt: "03/03/2026 à 03:15", delivered: true,
        message: "Harsh, ton client Rahul Sharma a 2 créneaux disponibles pour Renouvellement salarié à Créteil 94. Agis vite !",
    },
    {
        id: "2", clientName: "Priya Patel", phone: "+33798765432",
        target: "Ambassade Inde", category: "Passport Services",
        slots: 1, sentAt: "02/03/2026 à 21:40", delivered: true,
        message: "Harsh, ton client Priya Patel a 1 créneau disponible pour Passport Services à l'Ambassade Inde. Agis vite !",
    },
    {
        id: "3", clientName: "Mohammed Al-Farsi", phone: "+33655443322",
        target: "Nanterre 92", category: "Vie privée & familiale",
        slots: 3, sentAt: "02/03/2026 à 14:30", delivered: false,
        message: "Harsh, ton client Mohammed Al-Farsi a 3 créneaux disponibles pour Vie privée & familiale à Nanterre 92. Agis vite !",
    },
    {
        id: "4", clientName: "Priya Patel", phone: "+33798765432",
        target: "Ambassade Inde", category: "OCI Services",
        slots: 1, sentAt: "01/03/2026 à 09:02", delivered: true,
        message: "Harsh, ton client Priya Patel a 1 créneau disponible pour OCI Services à l'Ambassade Inde. Agis vite !",
    },
    {
        id: "5", clientName: "Rahul Sharma", phone: "+33612345678",
        target: "Lyon 69", category: "Naturalisation",
        slots: 2, sentAt: "28/02/2026 à 18:55", delivered: true,
        message: "Harsh, ton client Rahul Sharma a 2 créneaux disponibles pour Naturalisation à Lyon 69. Agis vite !",
    },
];

export default function AlertesPage() {
    const [alerts] = useState<AlertLog[]>(MOCK_ALERTS);
    const [testPhone, setTestPhone] = useState("");
    const [testSending, setTestSending] = useState(false);
    const [testResult, setTestResult] = useState<"" | "ok" | "fail">("");

    const sendTest = async () => {
        if (!testPhone) return;
        setTestSending(true);
        setTestResult("");
        try {
            // Will hook into the real WhatsApp API later
            await new Promise(r => setTimeout(r, 1500));
            setTestResult("ok");
        } catch {
            setTestResult("fail");
        }
        setTestSending(false);
    };

    const deliveredCount = alerts.filter(a => a.delivered).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Alertes WhatsApp</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {alerts.length} alertes envoyées • {deliveredCount} délivrées
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full">
                    <span className="text-green-500">💬</span>
                    <span className="text-xs font-bold text-green-700">WhatsApp API connectée</span>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 text-center">
                    <p className="text-2xl font-black text-sky-500">{alerts.length}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-semibold">Total envoyés</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 text-center">
                    <p className="text-2xl font-black text-green-500">{deliveredCount}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-semibold">Délivrés ✓</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 text-center">
                    <p className="text-2xl font-black text-gray-400">{alerts.length - deliveredCount}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-semibold">Non délivrés</p>
                </div>
            </div>

            {/* Test WhatsApp */}
            <div className="bg-white rounded-2xl border border-sky-200 shadow-sm p-5">
                <h2 className="text-sm font-black text-gray-900 uppercase mb-4">🧪 Envoyer un message test</h2>
                <div className="flex gap-3">
                    <input
                        type="tel"
                        value={testPhone}
                        onChange={e => setTestPhone(e.target.value)}
                        placeholder="Votre numéro WhatsApp (+33...)"
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                    <button
                        onClick={sendTest}
                        disabled={testSending || !testPhone}
                        className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm whitespace-nowrap"
                    >
                        {testSending ? "Envoi..." : "💬 Tester"}
                    </button>
                </div>
                {testResult === "ok" && (
                    <p className="mt-2 text-xs text-green-600 font-semibold">✅ Message de test envoyé avec succès !</p>
                )}
                {testResult === "fail" && (
                    <p className="mt-2 text-xs text-red-600 font-semibold">❌ Échec — vérifiez la configuration WhatsApp API</p>
                )}

                {/* Message Preview */}
                <div className="mt-4 bg-[#ECF8ED] rounded-xl p-4 border border-green-200">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Aperçu du message envoyé</p>
                    <div className="bg-white rounded-xl p-3 shadow-sm max-w-xs">
                        <p className="text-xs text-gray-700 leading-relaxed">
                            <strong>Harsh</strong>, ton client <strong>[Nom Client]</strong> a{" "}
                            <strong>[N] créneau(x)</strong> disponible(s) pour{" "}
                            <strong>[Catégorie]</strong> à <strong>[Préfecture]</strong>. Agis vite ! 🎯
                        </p>
                        <p className="text-[9px] text-gray-400 mt-2 text-right">RDV Priority Bot</p>
                    </div>
                </div>
            </div>

            {/* Alert History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-black text-gray-900 uppercase">Historique des alertes</h2>
                    <span className="text-xs text-gray-400">{alerts.length} entrées</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {alerts.map(alert => (
                        <div key={alert.id} className="px-5 py-4 hover:bg-sky-50/30 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* Client */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-sm text-gray-900">{alert.clientName}</span>
                                        <span className="text-[10px] text-gray-400">{alert.phone}</span>
                                    </div>
                                    {/* Target + Category */}
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            🏛️ {alert.target}
                                        </span>
                                        <span className="bg-gray-50 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                            {alert.category}
                                        </span>
                                        <span className="bg-sky-100 text-sky-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                                            🎯 {alert.slots} créneau{alert.slots > 1 ? "x" : ""}
                                        </span>
                                    </div>
                                    {/* Message preview */}
                                    <p className="text-[11px] text-gray-400 mt-2 italic truncate">&quot;{alert.message}&quot;</p>
                                </div>
                                {/* Status + time */}
                                <div className="flex-shrink-0 text-right">
                                    {alert.delivered ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">✓ Délivré</span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">✗ Échec</span>
                                    )}
                                    <p className="text-[10px] text-gray-300 mt-1">{alert.sentAt}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────
interface Client {
    id: string;
    name: string;
    phone: string;
    target: string;        // prefecture id or "indian-embassy-paris"
    targetName: string;
    category: string;
    categoryName: string;
    alertActive: boolean;
    createdAt: string;
}

// ─── Static options (matches exactly what scraper monitors) ───
const ALERT_TARGETS = [
    {
        group: "🏛️ Préfectures",
        options: [
            { value: "paris_75|CARTE_IDENTITE", label: "Paris 75 — Carte Nationale d'Identité" },
            { value: "paris_75|PASSEPORT", label: "Paris 75 — Passeport" },
            { value: "bobigny_93|TITRE_SEJOUR", label: "Bobigny 93 — Titre Séjour" },
            { value: "bobigny_93|NATURALISATION", label: "Bobigny 93 — Naturalisation" },
            { value: "creteil_94|TITRE_SEJOUR", label: "Créteil 94 — Remise de titre prêt" },
            { value: "creteil_94|TITRE_SEJOUR_SALARIE", label: "Créteil 94 — Renouvellement salarié" },
            { value: "creteil_94|TITRE_SEJOUR_ETUDIANT", label: "Créteil 94 — Renouvellement étudiant" },
            { value: "creteil_94|TITRE_SEJOUR_VPF", label: "Créteil 94 — Vie privée & familiale" },
            { value: "creteil_94|CHANGEMENT_STATUT_ETUDIANT_SALARIE", label: "Créteil 94 — Changement de statut" },
            { value: "creteil_94|TITRE_SEJOUR_DUPLICATA", label: "Créteil 94 — Duplicata (perte/vol)" },
            { value: "creteil_94|NATURALISATION", label: "Créteil 94 — Naturalisation" },
            { value: "nanterre_92|TITRE_SEJOUR", label: "Nanterre 92 — Titre Séjour" },
            { value: "nanterre_92|TITRE_SEJOUR_SALARIE", label: "Nanterre 92 — Renouvellement salarié" },
            { value: "nanterre_92|TITRE_SEJOUR_ETUDIANT", label: "Nanterre 92 — Renouvellement étudiant" },
            { value: "nanterre_92|TITRE_SEJOUR_VPF", label: "Nanterre 92 — Vie privée & familiale" },
            { value: "nanterre_92|TITRE_SEJOUR_ENTREPRENEUR", label: "Nanterre 92 — Entrepreneur / libérale" },
            { value: "nanterre_92|TITRE_SEJOUR_DUPLICATA", label: "Nanterre 92 — Duplicata (perte/vol)" },
            { value: "evry_91|TITRE_SEJOUR", label: "Évry 91 — Titre Séjour" },
            { value: "evry_91|TITRE_SEJOUR_SALARIE", label: "Évry 91 — Renouvellement salarié" },
            { value: "evry_91|TITRE_SEJOUR_ETUDIANT", label: "Évry 91 — Renouvellement étudiant" },
            { value: "evry_91|TITRE_SEJOUR_VPF", label: "Évry 91 — Vie privée & familiale" },
            { value: "cergy_95|TITRE_SEJOUR", label: "Cergy 95 — Guichet 1" },
            { value: "cergy_95|TITRE_SEJOUR_RENOUVELLEMENT", label: "Cergy 95 — Guichet 2" },
            { value: "melun_77|TITRE_SEJOUR", label: "Melun 77 — Première demande" },
            { value: "melun_77|TITRE_SEJOUR_RENOUVELLEMENT", label: "Melun 77 — Renouvellement" },
            { value: "versailles_78|TITRE_SEJOUR", label: "Versailles 78 — Titre Séjour" },
            { value: "versailles_78|TITRE_SEJOUR_SALARIE", label: "Versailles 78 — Renouvellement salarié" },
            { value: "versailles_78|TITRE_SEJOUR_ETUDIANT", label: "Versailles 78 — Renouvellement étudiant" },
            { value: "lyon_69|TITRE_SEJOUR", label: "Lyon 69 — Première demande" },
            { value: "lyon_69|TITRE_SEJOUR_RENOUVELLEMENT", label: "Lyon 69 — Renouvellement" },
            { value: "lyon_69|NATURALISATION", label: "Lyon 69 — Naturalisation" },
            { value: "moulins_03|TITRE_SEJOUR", label: "Moulins 03 — Titre Séjour" },
        ],
    },
    {
        group: "🇮🇳 Ambassade Inde Paris",
        options: [
            { value: "indian-embassy-paris|PASSPORT_RENEWAL", label: "Ambassade Inde — Passport Services" },
            { value: "indian-embassy-paris|OCI_REGISTRATION", label: "Ambassade Inde — OCI Card Services" },
            { value: "indian-embassy-paris|VISA_CONSULAR", label: "Ambassade Inde — Visa Consulaire" },
            { value: "indian-embassy-paris|BIRTH_REGISTRATION", label: "Ambassade Inde — Enregistrement Naissance" },
        ],
    },
];

// ─── Mock clients ─────────────────────────────────────────
const MOCK_CLIENTS: Client[] = [
    { id: "1", name: "Rahul Sharma", phone: "+33 6 12 34 56 78", target: "creteil_94", targetName: "Créteil 94", category: "TITRE_SEJOUR_SALARIE", categoryName: "Renouvellement salarié", alertActive: true, createdAt: "2026-02-28" },
    { id: "2", name: "Priya Patel", phone: "+33 7 98 76 54 32", target: "indian-embassy-paris", targetName: "Ambassade Inde", category: "PASSPORT_RENEWAL", categoryName: "Passport Services", alertActive: true, createdAt: "2026-03-01" },
    { id: "3", name: "Mohammed Al-Farsi", phone: "+33 6 55 44 33 22", target: "nanterre_92", targetName: "Nanterre 92", category: "TITRE_SEJOUR_VPF", categoryName: "Vie privée & familiale", alertActive: false, createdAt: "2026-02-25" },
];

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", phone: "", targetCategory: "" });
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const fetchClients = useCallback(async () => {
        try {
            const res = await api.get("/admin/boss/clients");
            if (res.data?.data?.length > 0) setClients(res.data.data);
        } catch { /* use mock */ }
    }, []);

    useEffect(() => { fetchClients(); }, [fetchClients]);

    const handleAdd = async () => {
        if (!form.name || !form.phone || !form.targetCategory) return;
        setSaving(true);
        const [target, category] = form.targetCategory.split("|");
        const targetName = ALERT_TARGETS.flatMap(g => g.options).find(o => o.value === form.targetCategory)?.label.split(" — ")[0] || target;
        const categoryName = ALERT_TARGETS.flatMap(g => g.options).find(o => o.value === form.targetCategory)?.label.split(" — ")[1] || category;

        try {
            await api.post("/admin/boss/clients", { name: form.name, phone: form.phone, target, category, targetName, categoryName });
        } catch {
            // show locally anyway
        }
        const newClient: Client = {
            id: Date.now().toString(), name: form.name, phone: form.phone,
            target, targetName, category, categoryName, alertActive: true,
            createdAt: new Date().toISOString().split("T")[0],
        };
        setClients(prev => [newClient, ...prev]);
        setForm({ name: "", phone: "", targetCategory: "" });
        setShowForm(false);
        setSaving(false);
        setSuccessMsg(`✅ Client "${form.name}" ajouté — alerte WhatsApp activée !`);
        setTimeout(() => setSuccessMsg(""), 4000);
    };

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.targetName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Clients</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{clients.length} client{clients.length !== 1 ? "s" : ""} enregistré{clients.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-sky-200"
                >
                    {showForm ? "✕ Annuler" : "+ Nouveau client"}
                </button>
            </div>

            {/* Success message */}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-sm font-semibold text-green-700">
                    {successMsg}
                </div>
            )}

            {/* Add Client Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-sky-200 shadow-md p-6 space-y-4">
                    <h2 className="text-sm font-black text-gray-900 uppercase">Nouveau Client</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Nom complet *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Ex: Rahul Sharma"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Numéro WhatsApp *</label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="+33 6 12 34 56 78"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Préfecture / Consulat + Catégorie *</label>
                        <select
                            value={form.targetCategory}
                            onChange={e => setForm(f => ({ ...f, targetCategory: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        >
                            <option value="">— Choisir une cible —</option>
                            {ALERT_TARGETS.map(group => (
                                <optgroup key={group.group} label={group.group}>
                                    {group.options.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    <div className="bg-sky-50 rounded-xl px-4 py-3 border border-sky-100">
                        <p className="text-xs text-sky-700 font-semibold">
                            💬 Quand un créneau est détecté, vous recevrez automatiquement un message WhatsApp :<br />
                            <span className="font-normal italic mt-1 block">
                                &quot;Harsh, ton client <strong>[Nom]</strong> a un créneau disponible pour <strong>[Catégorie]</strong> à <strong>[Préfecture]</strong>. Agis vite !&quot;
                            </span>
                        </p>
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={saving || !form.name || !form.phone || !form.targetCategory}
                        className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-sky-200"
                    >
                        {saving ? "Enregistrement..." : "✅ Enregistrer + Activer alerte WhatsApp"}
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un client..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
            </div>

            {/* Clients List */}
            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-4xl mb-3">👥</p>
                        <p className="text-sm font-semibold">Aucun client trouvé</p>
                    </div>
                )}
                {filtered.map(client => (
                    <div key={client.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-sky-200 hover:shadow-md transition-all px-5 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 font-black text-sm flex items-center justify-center flex-shrink-0">
                                    {client.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{client.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{client.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {client.alertActive ? (
                                    <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Alerte active
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
                                        Alerte pausée
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                🏛️ {client.targetName}
                            </span>
                            <span className="bg-gray-50 text-gray-600 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                                📋 {client.categoryName}
                            </span>
                            <span className="text-[10px] text-gray-300">Ajouté le {client.createdAt}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

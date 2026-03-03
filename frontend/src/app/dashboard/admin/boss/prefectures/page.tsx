"use client";

import { useState } from "react";

const PREFECTURES = [
    {
        id: "paris_75", name: "Paris", dept: "75", system: "ANTS",
        categories: [
            { name: "Carte Nationale d'Identité", procedure: "CARTE_IDENTITE", slots: 0, status: "ACTIVE" as const },
            { name: "Passeport", procedure: "PASSEPORT", slots: 0, status: "ACTIVE" as const },
        ],
    },
    {
        id: "bobigny_93", name: "Bobigny", dept: "93", system: "ezbooking",
        categories: [
            { name: "Titre de séjour", procedure: "TITRE_SEJOUR", slots: 0, status: "ACTIVE" as const },
            { name: "Naturalisation", procedure: "NATURALISATION", slots: 0, status: "ACTIVE" as const },
        ],
    },
    {
        id: "creteil_94", name: "Créteil", dept: "94", system: "RDV-Préfecture",
        categories: [
            { name: "Remise de titre prêt", procedure: "TITRE_SEJOUR", slots: 2, status: "ACTIVE" as const },
            { name: "Renouvellement salarié", procedure: "TITRE_SEJOUR_SALARIE", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement étudiant", procedure: "TITRE_SEJOUR_ETUDIANT", slots: 0, status: "ACTIVE" as const },
            { name: "Vie privée & familiale", procedure: "TITRE_SEJOUR_VPF", slots: 0, status: "ACTIVE" as const },
            { name: "Changement de statut", procedure: "CHANGEMENT_STATUT_ETUDIANT_SALARIE", slots: 0, status: "ACTIVE" as const },
            { name: "Duplicata (perte/vol)", procedure: "TITRE_SEJOUR_DUPLICATA", slots: 0, status: "ACTIVE" as const },
            { name: "Naturalisation", procedure: "NATURALISATION", slots: 0, status: "ACTIVE" as const },
        ],
    },
    {
        id: "nanterre_92", name: "Nanterre", dept: "92", system: "RDV-Préfecture",
        categories: [
            { name: "Titre de séjour général", procedure: "TITRE_SEJOUR", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement salarié", procedure: "TITRE_SEJOUR_SALARIE", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement étudiant", procedure: "TITRE_SEJOUR_ETUDIANT", slots: 0, status: "ACTIVE" as const },
            { name: "Vie privée & familiale", procedure: "TITRE_SEJOUR_VPF", slots: 0, status: "ACTIVE" as const },
            { name: "Entrepreneur / libérale", procedure: "TITRE_SEJOUR_ENTREPRENEUR", slots: 0, status: "ACTIVE" as const },
            { name: "Duplicata (perte/vol)", procedure: "TITRE_SEJOUR_DUPLICATA", slots: 0, status: "ACTIVE" as const },
            { name: "Naturalisation", procedure: "NATURALISATION", slots: 0, status: "ACTIVE" as const },
        ],
    },
    {
        id: "evry_91", name: "Évry", dept: "91", system: "RDV-Préfecture",
        categories: [
            { name: "Titre de séjour général", procedure: "TITRE_SEJOUR", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement salarié", procedure: "TITRE_SEJOUR_SALARIE", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement étudiant", procedure: "TITRE_SEJOUR_ETUDIANT", slots: 0, status: "ACTIVE" as const },
            { name: "Vie privée & familiale", procedure: "TITRE_SEJOUR_VPF", slots: 0, status: "ACTIVE" as const },
            { name: "Entrepreneur / libérale", procedure: "TITRE_SEJOUR_ENTREPRENEUR", slots: 0, status: "ACTIVE" as const },
            { name: "Duplicata (perte/vol)", procedure: "TITRE_SEJOUR_DUPLICATA", slots: 0, status: "ACTIVE" as const },
            { name: "Naturalisation", procedure: "NATURALISATION", slots: 0, status: "ACTIVE" as const },
        ],
    },
    {
        id: "cergy_95", name: "Cergy", dept: "95", system: "RDV-Préfecture",
        categories: [
            { name: "Titre de séjour Guichet 1", procedure: "TITRE_SEJOUR", slots: 0, status: "ACTIVE" as const },
            { name: "Titre de séjour Guichet 2", procedure: "TITRE_SEJOUR_RENOUVELLEMENT", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement salarié", procedure: "TITRE_SEJOUR_SALARIE", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement étudiant", procedure: "TITRE_SEJOUR_ETUDIANT", slots: 0, status: "ACTIVE" as const },
            { name: "Vie privée & familiale", procedure: "TITRE_SEJOUR_VPF", slots: 0, status: "ACTIVE" as const },
        ],
    },
    {
        id: "melun_77", name: "Melun", dept: "77", system: "ANEF",
        categories: [
            { name: "Première demande titre de séjour", procedure: "TITRE_SEJOUR", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement titre de séjour", procedure: "TITRE_SEJOUR_RENOUVELLEMENT", slots: 0, status: "ACTIVE" as const },
        ],
    },
    {
        id: "versailles_78", name: "Versailles", dept: "78", system: "RDV-Préfecture",
        categories: [
            { name: "Titre de séjour général", procedure: "TITRE_SEJOUR", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement salarié", procedure: "TITRE_SEJOUR_SALARIE", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement étudiant", procedure: "TITRE_SEJOUR_ETUDIANT", slots: 0, status: "ACTIVE" as const },
            { name: "Vie privée & familiale", procedure: "TITRE_SEJOUR_VPF", slots: 0, status: "ACTIVE" as const },
            { name: "Entrepreneur / libérale", procedure: "TITRE_SEJOUR_ENTREPRENEUR", slots: 0, status: "ACTIVE" as const },
            { name: "Duplicata (perte/vol)", procedure: "TITRE_SEJOUR_DUPLICATA", slots: 0, status: "ACTIVE" as const },
            { name: "Naturalisation", procedure: "NATURALISATION", slots: 0, status: "ACTIVE" as const },
        ],
    },
    {
        id: "lyon_69", name: "Lyon", dept: "69", system: "ANEF",
        categories: [
            { name: "Première demande titre de séjour", procedure: "TITRE_SEJOUR", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement titre de séjour", procedure: "TITRE_SEJOUR_RENOUVELLEMENT", slots: 0, status: "ACTIVE" as const },
            { name: "Naturalisation", procedure: "NATURALISATION", slots: 0, status: "ACTIVE" as const },
        ],
    },
    {
        id: "moulins_03", name: "Moulins", dept: "03", system: "RDV-Préfecture",
        categories: [
            { name: "Titre de séjour général", procedure: "TITRE_SEJOUR", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement salarié", procedure: "TITRE_SEJOUR_SALARIE", slots: 0, status: "ACTIVE" as const },
            { name: "Renouvellement étudiant", procedure: "TITRE_SEJOUR_ETUDIANT", slots: 0, status: "ACTIVE" as const },
            { name: "Vie privée & familiale", procedure: "TITRE_SEJOUR_VPF", slots: 0, status: "ACTIVE" as const },
            { name: "Duplicata (perte/vol)", procedure: "TITRE_SEJOUR_DUPLICATA", slots: 0, status: "ACTIVE" as const },
        ],
    },
];

const SYSTEM_COLORS: Record<string, string> = {
    "ANTS": "bg-blue-100 text-blue-700",
    "ezbooking": "bg-purple-100 text-purple-700",
    "RDV-Préfecture": "bg-orange-100 text-orange-700",
    "ANEF": "bg-teal-100 text-teal-700",
};

export default function PrefecturesPage() {
    const [expanded, setExpanded] = useState<string | null>("creteil_94");

    const totalCategories = PREFECTURES.reduce((sum, p) => sum + p.categories.length, 0);
    const totalSlots = PREFECTURES.reduce((sum, p) => sum + p.categories.reduce((s, c) => s + c.slots, 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Préfectures</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{PREFECTURES.length} préfectures • {totalCategories} catégories surveillées</p>
                </div>
                {totalSlots > 0 && (
                    <span className="flex items-center gap-2 bg-sky-500 text-white text-sm font-black px-4 py-2 rounded-full animate-pulse shadow-lg shadow-sky-200">
                        🎯 {totalSlots} créneau{totalSlots > 1 ? "x" : ""} disponible{totalSlots > 1 ? "s" : ""}!
                    </span>
                )}
            </div>

            {/* Prefecture Cards */}
            <div className="space-y-3">
                {PREFECTURES.map((pref) => {
                    const isOpen = expanded === pref.id;
                    const prefSlots = pref.categories.reduce((s, c) => s + c.slots, 0);
                    return (
                        <div
                            key={pref.id}
                            className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 overflow-hidden
                ${isOpen ? "border-sky-300 shadow-md shadow-sky-100" : "border-gray-100 hover:border-sky-200"}`}
                        >
                            {/* Accordion Header */}
                            <button
                                onClick={() => setExpanded(isOpen ? null : pref.id)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black
                    ${prefSlots > 0 ? "bg-sky-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                                        {pref.dept}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{pref.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SYSTEM_COLORS[pref.system]}`}>
                                                {pref.system}
                                            </span>
                                            <span className="text-[10px] text-gray-400">{pref.categories.length} catégories</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {prefSlots > 0 && (
                                        <span className="bg-sky-500 text-white text-xs font-black px-2.5 py-1 rounded-full animate-pulse">
                                            {prefSlots} slot{prefSlots > 1 ? "s" : ""}
                                        </span>
                                    )}
                                    <span className={`w-2 h-2 rounded-full ${prefSlots > 0 ? "bg-sky-400 animate-pulse" : "bg-green-400"}`} />
                                    <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▼</span>
                                </div>
                            </button>

                            {/* Accordion Body */}
                            {isOpen && (
                                <div className="border-t border-gray-50 px-5 py-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {pref.categories.map((cat) => (
                                            <div
                                                key={cat.procedure}
                                                className={`flex items-center justify-between p-3 rounded-xl transition-colors
                          ${cat.slots > 0 ? "bg-sky-50 border border-sky-200" : "bg-gray-50"}`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cat.slots > 0 ? "bg-sky-500 animate-pulse" : "bg-green-400"}`} />
                                                    <span className="text-xs font-semibold text-gray-700 truncate">{cat.name}</span>
                                                </div>
                                                {cat.slots > 0 ? (
                                                    <span className="ml-2 flex-shrink-0 bg-sky-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                        {cat.slots}
                                                    </span>
                                                ) : (
                                                    <span className="ml-2 flex-shrink-0 text-[10px] text-gray-300 font-medium">0</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

"use client";

const EMBASSY_CATEGORIES = [
    {
        id: 3, code: "PASSPORT", name: "Passport Services", icon: "🛂",
        color: "sky",
        subServices: ["Nouveau passeport", "Renouvellement", "Ré-émission", "Tatkal (urgent)"],
        slots: 0, status: "ACTIVE" as const,
        lastChecked: "Il y a 1 min",
    },
    {
        id: 1, code: "OCI", name: "OCI Card Services", icon: "🪪",
        color: "blue",
        subServices: ["Enregistrement OCI", "Renouvellement OCI", "Modifications diverses"],
        slots: 0, status: "ACTIVE" as const,
        lastChecked: "Il y a 1 min",
    },
    {
        id: 2, code: "VISA", name: "Visa Consulaire", icon: "📄",
        color: "purple",
        subServices: ["Visa consulaire standard"],
        slots: 0, status: "ACTIVE" as const,
        lastChecked: "Il y a 3 min",
    },
    {
        id: 27, code: "BIRTH", name: "Enregistrement Naissance", icon: "👶",
        color: "green",
        subServices: ["Enregistrement de naissance (nouveau-né uniquement, pas via e-SEWA)"],
        slots: 0, status: "ACTIVE" as const,
        lastChecked: "Il y a 2 min",
    },
];

const COLOR_MAP: Record<string, { bg: string; border: string; badge: string; text: string }> = {
    sky: { bg: "bg-sky-50", border: "border-sky-300", badge: "bg-sky-500 text-white", text: "text-sky-700" },
    blue: { bg: "bg-blue-50", border: "border-blue-300", badge: "bg-blue-500 text-white", text: "text-blue-700" },
    purple: { bg: "bg-purple-50", border: "border-purple-300", badge: "bg-purple-500 text-white", text: "text-purple-700" },
    green: { bg: "bg-green-50", border: "border-green-300", badge: "bg-green-500 text-white", text: "text-green-700" },
};

export default function ConsulatPage() {
    const totalSlots = EMBASSY_CATEGORIES.reduce((s, c) => s + c.slots, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        🇮🇳 Ambassade de l&apos;Inde — Paris
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        20-22 Rue Albéric Magnard, 75116 Paris • appointment.eoiparis.com
                    </p>
                </div>
                {totalSlots > 0 && (
                    <span className="flex items-center gap-2 bg-sky-500 text-white text-sm font-black px-4 py-2 rounded-full animate-pulse shadow-lg shadow-sky-200">
                        🎯 {totalSlots} créneau disponible !
                    </span>
                )}
            </div>

            {/* VFS Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                    <p className="text-sm font-bold text-amber-800">VFS Global a arrêté ses opérations le 01/07/2025</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                        Tous les services CPV (Passeport, OCI, Visa, Naissance) sont maintenant gérés directement par l&apos;Ambassade.
                        Services divers via e-SEWA (hors système d&apos;appointments).
                    </p>
                </div>
            </div>

            {/* Slot Release Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-sky-100 shadow-sm px-5 py-4">
                    <p className="text-xs font-black text-gray-500 uppercase mb-2">Ouverture mensuelle</p>
                    <p className="text-2xl font-black text-sky-600">25</p>
                    <p className="text-sm text-gray-600 mt-0.5">de chaque mois à <strong>09:00</strong></p>
                    <p className="text-xs text-gray-400 mt-1">Tous les créneaux du mois suivant s&apos;ouvrent d&apos;un coup</p>
                </div>
                <div className="bg-white rounded-2xl border border-green-100 shadow-sm px-5 py-4">
                    <p className="text-xs font-black text-gray-500 uppercase mb-2">Ouverture hebdomadaire</p>
                    <p className="text-2xl font-black text-green-600">Vendredi</p>
                    <p className="text-sm text-gray-600 mt-0.5">chaque vendredi à <strong>09:00</strong></p>
                    <p className="text-xs text-gray-400 mt-1">Créneaux limités pour la semaine suivante</p>
                </div>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {EMBASSY_CATEGORIES.map((cat) => {
                    const c = COLOR_MAP[cat.color];
                    return (
                        <div
                            key={cat.id}
                            className={`bg-white rounded-2xl border-l-4 shadow-sm ${c.border} overflow-hidden hover:shadow-md transition-shadow`}
                        >
                            <div className={`px-5 py-4 ${cat.slots > 0 ? c.bg : ""}`}>
                                {/* Cat Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{cat.icon}</span>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{cat.name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">Category ID: {cat.id}</p>
                                        </div>
                                    </div>
                                    {cat.slots > 0 ? (
                                        <span className={`text-sm font-black px-3 py-1 rounded-full animate-pulse ${c.badge}`}>
                                            {cat.slots} slot{cat.slots > 1 ? "s" : ""}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-300 font-medium">0 slot</span>
                                    )}
                                </div>

                                {/* Sub-services */}
                                <div className="mt-3 space-y-1">
                                    {cat.subServices.map((s) => (
                                        <div key={s} className="flex items-center gap-2">
                                            <span className={`w-1 h-1 rounded-full ${c.text.replace("text", "bg")}`} />
                                            <span className="text-xs text-gray-500">{s}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Status */}
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-[10px] font-semibold text-green-600">Surveillance active</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">Vérifié {cat.lastChecked}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Rules */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-sm px-5 py-4">
                <p className="text-xs font-black text-gray-500 uppercase mb-3">Règles importantes à noter</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                    {[
                        "Max 2 services par appointment",
                        "Un seul RDV à la fois — annuler avant d'en prendre un 2ème",
                        "Soumission: Lun-Ven 09:30-12:30 et 14:00-15:00",
                        "Collecte: sans RDV, 16:00-17:00 tous les jours ouvrés",
                        "Uniquement paiement en espèces actuellement",
                        "Annulation possible jusqu'à 12h avant le RDV",
                    ].map((rule) => (
                        <div key={rule} className="flex items-start gap-2">
                            <span className="text-sky-400 mt-0.5 flex-shrink-0">→</span>
                            <span>{rule}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

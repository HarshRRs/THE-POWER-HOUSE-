/**
 * RDVPriority - Prefecture Configuration
 *
 * Complete list of monitored prefectures with booking URLs.
 * This is the single source of truth for all prefecture data.
 */

const PREFECTURES = [
    // ═══════════════════════════════════════════
    // TIER 1 — CRITICAL (Paris Region) ★★★★★
    // ═══════════════════════════════════════════
    {
        id: "paris-75",
        name: "Paris",
        department: "75",
        region: "Île-de-France",
        tier: 1,
        bookingUrl: "https://www.prefecturedepolice.interieur.gouv.fr/demarches",
        alternateUrls: [
            "https://www.prefecturedepolice.interieur.gouv.fr",
        ],
        selectors: {
            bookingButton: 'a[href*="rendez-vous"], a[href*="booking"], button:has-text("Prendre")',
            availabilityIndicator: '.available, .slot-available, [data-available="true"]',
            noSlotIndicator: '.no-slot, .complet, :has-text("aucun créneau")',
        },
        procedures: ["titre_sejour", "naturalisation", "visa", "student"],
        checkInterval: 60, // seconds
        active: true,
    },
    {
        id: "bobigny-93",
        name: "Bobigny (Seine-Saint-Denis)",
        department: "93",
        region: "Île-de-France",
        tier: 1,
        bookingUrl: "https://www.seine-saint-denis.gouv.fr",
        procedures: ["titre_sejour", "naturalisation"],
        checkInterval: 60,
        active: true,
    },
    {
        id: "creteil-94",
        name: "Créteil (Val-de-Marne)",
        department: "94",
        region: "Île-de-France",
        tier: 1,
        bookingUrl: "https://www.val-de-marne.gouv.fr",
        procedures: ["titre_sejour", "naturalisation"],
        checkInterval: 90,
        active: true,
    },
    {
        id: "nanterre-92",
        name: "Nanterre (Hauts-de-Seine)",
        department: "92",
        region: "Île-de-France",
        tier: 1,
        bookingUrl: "https://www.hauts-de-seine.gouv.fr",
        procedures: ["titre_sejour", "naturalisation"],
        checkInterval: 90,
        active: true,
    },

    // ═══════════════════════════════════════════
    // TIER 2 — HIGH DEMAND ★★★★
    // ═══════════════════════════════════════════
    {
        id: "lyon-69",
        name: "Lyon (Rhône)",
        department: "69",
        region: "Auvergne-Rhône-Alpes",
        tier: 2,
        bookingUrl: "https://www.rhone.gouv.fr",
        procedures: ["titre_sejour", "naturalisation"],
        checkInterval: 120,
        active: true,
    },
    {
        id: "evry-91",
        name: "Évry (Essonne)",
        department: "91",
        region: "Île-de-France",
        tier: 2,
        bookingUrl: "https://www.essonne.gouv.fr",
        procedures: ["titre_sejour"],
        checkInterval: 120,
        active: true,
    },

    // ═══════════════════════════════════════════
    // TIER 3 — MEDIUM DEMAND ★★★
    // ═══════════════════════════════════════════
    {
        id: "marseille-13",
        name: "Marseille (Bouches-du-Rhône)",
        department: "13",
        region: "Provence-Alpes-Côte d'Azur",
        tier: 3,
        bookingUrl: "https://www.bouches-du-rhone.gouv.fr",
        procedures: ["titre_sejour", "naturalisation"],
        checkInterval: 180,
        active: true,
    },
    {
        id: "lille-59",
        name: "Lille (Nord)",
        department: "59",
        region: "Hauts-de-France",
        tier: 3,
        bookingUrl: "https://www.nord.gouv.fr",
        procedures: ["titre_sejour"],
        checkInterval: 180,
        active: true,
    },
    {
        id: "bordeaux-33",
        name: "Bordeaux (Gironde)",
        department: "33",
        region: "Nouvelle-Aquitaine",
        tier: 3,
        bookingUrl: "https://www.gironde.gouv.fr",
        procedures: ["titre_sejour"],
        checkInterval: 180,
        active: true,
    },
    {
        id: "toulouse-31",
        name: "Toulouse (Haute-Garonne)",
        department: "31",
        region: "Occitanie",
        tier: 3,
        bookingUrl: "https://www.haute-garonne.gouv.fr",
        procedures: ["titre_sejour"],
        checkInterval: 180,
        active: true,
    },
];

module.exports = { PREFECTURES };

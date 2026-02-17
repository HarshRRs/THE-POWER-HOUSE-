"use client";

import { useState, useCallback, useMemo } from "react";
import api from "@/lib/api";

export interface Prefecture {
    id: string;
    name: string;
    department: string;
    region: string;
    bookingUrl: string;
    status: string; // ACTIVE, ERROR, CAPTCHA, PAUSED
    tier: number;
    lastCheckedAt: string | null;
    lastSlotFoundAt: string | null;
    _count?: { alerts: number };
}

export const REGIONS = [
    "Toutes",
    "Île-de-France",
    "Auvergne-Rhône-Alpes",
    "Provence-Alpes-Côte d'Azur",
    "Occitanie",
    "Nouvelle-Aquitaine",
    "Grand Est",
    "Hauts-de-France",
    "Bretagne",
    "Normandie",
    "Pays de la Loire",
    "Bourgogne-Franche-Comté",
    "Centre-Val de Loire",
    "Corse",
    "Outre-mer",
];

export function usePrefectures() {
    const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("Toutes");

    const fetchPrefectures = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/prefectures");
            setPrefectures(res.data.data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to fetch prefectures";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const filteredPrefectures = useMemo(() => {
        let result = prefectures;
        if (selectedRegion !== "Toutes") {
            result = result.filter((p) => p.region === selectedRegion);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.department.toLowerCase().includes(q) ||
                    p.region.toLowerCase().includes(q)
            );
        }
        return result;
    }, [prefectures, searchQuery, selectedRegion]);

    return {
        prefectures,
        filteredPrefectures,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        selectedRegion,
        setSelectedRegion,
        fetchPrefectures,
    };
}

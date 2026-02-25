"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

interface Prefecture {
  id: string;
  name: string;
  department: string;
  region: string;
  status: "hot" | "warm" | "cold";
  slotsFound24h: number;
  coordinates?: { lat: number; lng: number };
}

interface Props {
  selectedProcedure: string;
}

export default function PrefectureMap({ selectedProcedure }: Props) {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/boss/heatmap")
      .then((res) => res.json())
      .then((data) => {
        setPrefectures(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hot":
        return "bg-success";
      case "warm":
        return "bg-warning";
      default:
        return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-xl p-8 border border-border text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted mt-4">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Carte des Préfectures
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted">Actif (5+ créneaux)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted">Modéré (1-4 créneaux)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span className="text-muted">Calme (0 créneau)</span>
          </div>
        </div>
      </div>

      {/* Simplified Grid Map */}
      <div className="grid grid-cols-10 gap-2">
        {prefectures.slice(0, 100).map((pref) => (
          <div
            key={pref.id}
            className={`aspect-square rounded-lg ${getStatusColor(
              pref.status
            )} cursor-pointer hover:scale-110 transition-transform relative group`}
            title={`${pref.name} - ${pref.slotsFound24h} créneaux`}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface border border-border rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <p className="font-semibold">{pref.name}</p>
              <p className="text-muted">{pref.slotsFound24h} créneaux 24h</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-muted text-sm mt-4">
        {prefectures.filter((p) => p.status === "hot").length} préfectures actives |
        {" "}
        {prefectures.reduce((acc, p) => acc + p.slotsFound24h, 0)} créneaux trouvés
        aujourd&apos;hui
      </p>
    </div>
  );
}

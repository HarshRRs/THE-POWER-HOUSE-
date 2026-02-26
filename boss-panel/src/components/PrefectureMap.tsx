"use client";

import { useEffect, useState } from "react";
import { MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { authHeaders } from "@/lib/utils";

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
  const { isConnected, data } = useWebSocket();
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function fetchFromApi() {
    setError(null);
    setLoading(true);
    fetch("/api/boss/heatmap", { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load heatmap (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setPrefectures(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load heatmap');
        setLoading(false);
      });
  }

  // Use WebSocket data if available, otherwise fetch from API
  useEffect(() => {
    if (data?.prefectures) {
      // Transform WebSocket data to include status
      const transformed = data.prefectures.map((p: any) => ({
        ...p,
        status: getStatusFromData(p, data.recentDetections),
        slotsFound24h: getSlotCount(p.id, data.recentDetections),
      }));
      setPrefectures(transformed);
      setLoading(false);
    } else {
      fetchFromApi();
    }
  }, [data]);

  const getStatusFromData = (prefecture: any, detections: any[]) => {
    const count = getSlotCount(prefecture.id, detections);
    if (count >= 5) return "hot";
    if (count >= 1) return "warm";
    return "cold";
  };

  const getSlotCount = (prefectureId: string, detections: any[]) => {
    if (!detections) return 0;
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return detections.filter(
      (d) => d.prefectureId === prefectureId && new Date(d.detectedAt) > last24h
    ).length;
  };

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

  if (error) {
    return (
      <div className="glass rounded-xl p-6 border border-border">
        <div className="flex flex-col items-center gap-3 py-4">
          <AlertCircle className="h-8 w-8 text-danger" />
          <p className="text-danger text-sm">{error}</p>
          <button onClick={fetchFromApi} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-8 border border-border text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted mt-4">Chargement de la carte...</p>
      </div>
    );
  }

  const activeCount = prefectures.filter((p) => p.status === "hot").length;
  const totalSlots = prefectures.reduce((acc, p) => acc + p.slotsFound24h, 0);

  return (
    <div className="glass rounded-xl p-6 border border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Carte des Préfectures
          {!isConnected && (
            <span className="text-xs text-danger">(Offline)</span>
          )}
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted">Actif (5+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted">Modéré (1-4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span className="text-muted">Calme (0)</span>
          </div>
        </div>
      </div>

      {/* Grid Map */}
      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
        {prefectures.slice(0, 100).map((pref) => (
          <div
            key={pref.id}
            className={`aspect-square rounded-md sm:rounded-lg ${getStatusColor(
              pref.status
            )} cursor-pointer hover:scale-110 transition-transform relative group`}
            title={`${pref.name} - ${pref.slotsFound24h} créneaux`}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <p className="font-semibold">{pref.name}</p>
              <p className="text-muted">{pref.slotsFound24h} créneaux 24h</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-muted text-sm mt-4">
        {activeCount} préfectures actives | {totalSlots} créneaux trouvés aujourd&apos;hui
        {selectedProcedure !== "ALL" && (
          <span className="text-primary ml-2">
            (Filtré: {selectedProcedure})
          </span>
        )}
      </p>
    </div>
  );
}

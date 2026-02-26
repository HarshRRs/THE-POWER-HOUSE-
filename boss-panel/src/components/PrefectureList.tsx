"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Bell, AlertCircle, RefreshCw } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { authHeaders } from "@/lib/utils";

interface Prefecture {
  id: string;
  name: string;
  department: string;
  region: string;
  tier: number;
  bookingUrl: string;
  lastScrapedAt: string | null;
  lastSlotFoundAt: string | null;
  latestSlot: {
    slotDate: string;
    slotTime: string;
    slotsAvailable: number;
    detectedAt: string;
  } | null;
  status: "hot" | "warm" | "cold";
}

interface Props {
  selectedProcedure: string;
}

export default function PrefectureList({ selectedProcedure }: Props) {
  const { isConnected, data } = useWebSocket();
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function fetchFromApi() {
    setError(null);
    setLoading(true);
    fetch("/api/boss/prefectures", { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load prefectures (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setPrefectures(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load prefectures');
        setLoading(false);
      });
  }

  // Use WebSocket data or fetch from API
  useEffect(() => {
    if (data?.prefectures) {
      // Transform WebSocket data
      const transformed = data.prefectures.map((p: any) => ({
        ...p,
        status: getStatusFromTimestamp(p.lastSlotFoundAt),
        latestSlot: getLatestSlot(p.id, data.recentDetections),
      }));
      setPrefectures(transformed);
      setLoading(false);
    } else {
      fetchFromApi();
    }
  }, [data]);

  const getStatusFromTimestamp = (lastSlotFoundAt: string | null) => {
    if (!lastSlotFoundAt) return "cold";
    const hoursSince = (Date.now() - new Date(lastSlotFoundAt).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 1) return "hot";
    if (hoursSince < 24) return "warm";
    return "cold";
  };

  const getLatestSlot = (prefectureId: string, detections: any[]) => {
    if (!detections) return null;
    const detection = detections.find((d) => d.prefectureId === prefectureId);
    return detection
      ? {
          slotDate: detection.slotDate,
          slotTime: detection.slotTime,
          slotsAvailable: detection.slotsAvailable,
          detectedAt: detection.detectedAt,
        }
      : null;
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

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1:
        return "🔥 T1";
      case 2:
        return "⭐ T2";
      default:
        return "📍 T3";
    }
  };

  // Filter by procedure if selected (filter by tier as a proxy since procedures map to tiers)
  const filteredPrefectures = selectedProcedure === "ALL"
    ? prefectures
    : prefectures.filter((p) => {
        // Tier 1 prefectures handle most procedure types; filter based on common mappings
        if (selectedProcedure === "TITRE_SEJOUR" || selectedProcedure === "NATURALISATION") {
          return true; // All prefectures handle these
        }
        // Most specific procedures are only at Tier 1/2 prefectures
        return p.tier <= 2;
      });

  if (error) {
    return (
      <div className="glass rounded-xl border border-border p-6">
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
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-border h-[600px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold">
          Préfectures ({filteredPrefectures.length})
          {!isConnected && <span className="text-danger text-xs ml-2">(Offline)</span>}
        </h3>
        <Bell className="h-4 w-4 text-muted" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border">
          {filteredPrefectures.map((pref) => (
            <div
              key={pref.id}
              className="px-4 py-3 hover:bg-surface/50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{getTierLabel(pref.tier)}</span>
                    <h4 className="font-medium text-sm truncate">{pref.name}</h4>
                    <div
                      className={`h-2 w-2 rounded-full ${getStatusColor(
                        pref.status
                      )} flex-shrink-0`}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {pref.department} - {pref.region}
                  </p>
                  {pref.latestSlot && (
                    <p className="text-xs text-success mt-1">
                      Dernier: {pref.latestSlot.slotDate} {pref.latestSlot.slotTime}
                    </p>
                  )}
                </div>
                <a
                  href={pref.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-primary/10 rounded-lg flex-shrink-0"
                  aria-label={`Open booking page for ${pref.name}`}
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Bell } from "lucide-react";
import { formatTime } from "@/lib/utils";

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
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/boss/prefectures")
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
        <h3 className="font-semibold">Préfectures ({prefectures.length})</h3>
        <Bell className="h-4 w-4 text-muted" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border">
          {prefectures.map((pref) => (
            <div
              key={pref.id}
              className="px-4 py-3 hover:bg-surface/50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{getTierLabel(pref.tier)}</span>
                    <h4 className="font-medium text-sm">{pref.name}</h4>
                    <div
                      className={`h-2 w-2 rounded-full ${getStatusColor(
                        pref.status
                      )}`}
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
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-primary/10 rounded-lg"
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

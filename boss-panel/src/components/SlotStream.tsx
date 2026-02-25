"use client";

import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { formatTime, getProcedureLabel } from "@/lib/utils";

interface SlotEvent {
  id: string;
  prefectureName: string;
  procedure: string;
  slotDate: string;
  slotTime: string;
  detectedAt: string;
  status: "AVAILABLE" | "BOOKED" | "EXPIRED";
}

export default function SlotStream() {
  const [events, setEvents] = useState<SlotEvent[]>([]);

  useEffect(() => {
    // Fetch initial stream
    fetch("/api/boss/slot-stream?limit=20")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(() => {
        // Use mock data if API not available
        setEvents([
          {
            id: "1",
            prefectureName: "Paris",
            procedure: "TITRE_SEJOUR",
            slotDate: "15/03/2024",
            slotTime: "14:30",
            detectedAt: new Date().toISOString(),
            status: "AVAILABLE",
          },
          {
            id: "2",
            prefectureName: "Lyon",
            procedure: "NATURALISATION",
            slotDate: "16/03/2024",
            slotTime: "10:00",
            detectedAt: new Date(Date.now() - 60000).toISOString(),
            status: "AVAILABLE",
          },
        ]);
      });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "🟢";
      case "BOOKED":
        return "🔵";
      case "EXPIRED":
        return "⚫";
      default:
        return "⚪";
    }
  };

  return (
    <div className="glass rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Flux en Direct
        </h3>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted">LIVE</span>
        </div>
      </div>

      <div className="h-48 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto">
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted">
              En attente de créneaux...
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface/50 hover:bg-surface transition-colors text-sm"
                >
                  <span className="font-mono text-xs text-muted">
                    {formatTime(event.detectedAt)}
                  </span>
                  <span>{getStatusIcon(event.status)}</span>
                  <span className="font-medium">{event.prefectureName}</span>
                  <span className="text-muted">-</span>
                  <span className="text-primary">
                    {getProcedureLabel(event.procedure)}
                  </span>
                  <span className="text-muted">-</span>
                  <span className="font-mono">
                    {event.slotDate} {event.slotTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

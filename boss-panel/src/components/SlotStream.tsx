"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { formatTime, getProcedureLabel, getDetectionLocationName } from "@/lib/utils";
import { useWebSocket } from "@/hooks/useWebSocket";

const INITIAL_DISPLAY_LIMIT = 50;
const LOAD_MORE_COUNT = 50;

export default function SlotStream() {
  const { isConnected, data, latestDetection } = useWebSocket();
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);

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

  const events = data?.recentDetections || [];
  const visibleEvents = events.slice(0, displayLimit);
  const hasMore = events.length > displayLimit;

  return (
    <div className="glass rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Flux en Direct
        </h3>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full animate-pulse ${isConnected ? 'bg-success' : 'bg-danger'}`} />
          <span className="text-xs text-muted">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      <div className="h-48 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto">
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted">
              {isConnected ? 'En attente de créneaux...' : 'Connexion en cours...'}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {visibleEvents.map((event: any, index: number) => (
                <div
                  key={event.id || index}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface/50 hover:bg-surface transition-colors text-sm"
                >
                  <span className="font-mono text-xs text-muted">
                    {formatTime(event.detectedAt || event.timestamp)}
                  </span>
                  <span>{getStatusIcon(event.status || 'AVAILABLE')}</span>
                  <span className="font-medium">{getDetectionLocationName(event)}</span>
                  <span className="text-muted">-</span>
                  <span className="text-primary">
                    {getProcedureLabel(event.procedure || 'TITRE_SEJOUR')}
                  </span>
                  <span className="text-muted">-</span>
                  <span className="font-mono">
                    {event.slotDate} {event.slotTime}
                  </span>
                </div>
              ))}
              {hasMore && (
                <button
                  onClick={() => setDisplayLimit(prev => prev + LOAD_MORE_COUNT)}
                  className="w-full py-2 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  Load more ({events.length - displayLimit} remaining)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

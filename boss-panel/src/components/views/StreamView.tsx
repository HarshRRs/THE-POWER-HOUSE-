'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import { Activity, Clock, MapPin, Zap } from 'lucide-react';
import { formatTime, getDetectionLocationName } from '@/lib/utils';

export default function StreamView() {
  const { isConnected, data } = useWebSocket();

  const events = data?.recentDetections || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">LIVE STREAM</h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30">
              <Activity className="w-4 h-4 text-cyan" />
              <span className="text-xs text-cyan font-medium">REAL-TIME</span>
            </div>
          </div>
          <p className="text-text-muted mt-1">Real-time slot detection feed</p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="badge badge-cyan">
              <Zap className="w-3 h-3 mr-1" />
              LIVE
            </div>
          ) : (
            <div className="badge badge-warning">
              <span className="status-dot status-dot-warning mr-2 animate-pulse" />
              Reconnecting
            </div>
          )}
        </div>
      </div>

      {/* Stream */}
      <div className="card overflow-hidden tech-corner">
        <div className="p-4 border-b border-cyan/20 bg-gradient-to-r from-cyan/5 to-transparent">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan" />
            <span className="font-semibold text-white tracking-wide">DETECTION FEED</span>
            <span className="text-sm text-cyan">({events.length} events)</span>
          </div>
        </div>

        <div className="h-[600px] overflow-y-auto">
          {events.length === 0 ? (
            <div className="empty-state h-full">
              <Activity className="w-12 h-12 text-cyan/30 mb-4" />
              <p className="empty-state-title">No detections yet</p>
              <p className="empty-state-description">
                Waiting for slot detection events...
              </p>
            </div>
          ) : (
            <div className="divide-y divide-cyan/10">
              {events.map((event: any, index: number) => (
                <div 
                  key={event.id || index} 
                  className="p-4 hover:bg-cyan/5 transition-all group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan to-cyan-dark flex items-center justify-center flex-shrink-0 shadow-glow-cyan">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white group-hover:text-cyan transition-colors">
                        {getDetectionLocationName(event)}
                      </p>
                      <p className="text-sm text-cyan">
                        {event.slotDate} at {event.slotTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted bg-surfaceLight px-3 py-1.5 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(event.detectedAt || event.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

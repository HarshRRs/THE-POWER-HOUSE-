'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import { Activity, Clock, MapPin, Zap } from 'lucide-react';
import { formatTime, getDetectionLocationName } from '@/lib/utils';

export default function RecentActivity() {
  const { data } = useWebSocket();
  const events = data?.recentDetections?.slice(0, 6) || [];

  return (
    <div className="card overflow-hidden tech-corner">
      <div className="p-4 border-b border-cyan/20 bg-gradient-to-r from-cyan/5 to-transparent">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan" />
          <span className="font-semibold text-white text-sm tracking-wide">RECENT ACTIVITY</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
            <span className="text-xs text-cyan">LIVE</span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-cyan/10">
        {events.length === 0 ? (
          <div className="p-8 text-center">
            <Zap className="w-10 h-10 text-cyan/30 mx-auto mb-3" />
            <p className="text-text-muted text-sm">No recent activity detected</p>
          </div>
        ) : (
          events.map((event: any, index: number) => (
            <div key={event.id || index} className="p-4 hover:bg-cyan/5 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan to-cyan-dark flex items-center justify-center flex-shrink-0 shadow-glow-cyan group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-cyan transition-colors">
                    {getDetectionLocationName(event)}
                  </p>
                  <p className="text-xs text-cyan">
                    {event.slotDate} at {event.slotTime}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-muted bg-surfaceLight px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  {formatTime(event.detectedAt || event.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

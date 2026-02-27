'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { MapPin, Zap } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Prefecture {
  id: string;
  name: string;
  status: 'hot' | 'warm' | 'cold';
  slotsFound24h: number;
}

export default function PrefectureHeatmap() {
  const { data } = useWebSocket();
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);

  useEffect(() => {
    if (data?.prefectures) {
      const transformed = data.prefectures.map((p: any) => ({
        id: p.id,
        name: p.name,
        status: getStatusFromData(p, data.recentDetections),
        slotsFound24h: getSlotCount(p.id, data.recentDetections),
      }));
      setPrefectures(transformed);
    } else {
      apiFetch('/api/boss/heatmap')
        .then((res) => res.json())
        .then((data) => setPrefectures(data));
    }
  }, [data]);

  const getStatusFromData = (prefecture: any, detections: any[]): 'hot' | 'warm' | 'cold' => {
    const count = getSlotCount(prefecture.id, detections);
    if (count >= 5) return 'hot';
    if (count >= 1) return 'warm';
    return 'cold';
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
      case 'hot':
        return 'bg-gradient-to-br from-cyan to-cyan-dark shadow-glow-cyan';
      case 'warm':
        return 'bg-cyan/30';
      default:
        return 'bg-surfaceLight';
    }
  };

  const hotCount = prefectures.filter((p) => p.status === 'hot').length;
  const warmCount = prefectures.filter((p) => p.status === 'warm').length;

  return (
    <div className="card p-4 lg:p-5 tech-corner">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-cyan" />
          <h3 className="font-semibold text-white text-sm tracking-wide">PREFECTURE ACTIVITY</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-cyan to-cyan-dark shadow-glow-cyan" />
            <span className="text-cyan font-medium">ACTIVE ({hotCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-cyan/30" />
            <span className="text-text-muted">MODERATE ({warmCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-surfaceLight" />
            <span className="text-text-muted">QUIET</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-10 sm:grid-cols-20 gap-1.5">
        {prefectures.slice(0, 100).map((pref) => (
          <div
            key={pref.id}
            className={`aspect-square rounded-sm ${getStatusColor(pref.status)} cursor-pointer hover:scale-125 transition-all duration-200 relative group ${pref.status === 'hot' ? 'animate-pulse-slow' : ''}`}
            title={`${pref.name}: ${pref.slotsFound24h} slots`}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-sidebar text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none border border-cyan/30 shadow-glow-cyan">
              {pref.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

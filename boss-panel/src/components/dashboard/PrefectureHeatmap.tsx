'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { MapPin } from 'lucide-react';
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
        .then((res) => res.ok ? res.json() : [])
        .then((data) => {
          const list = data.data || data || [];
          if (Array.isArray(list)) setPrefectures(list);
        })
        .catch(() => {});
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
      case 'hot': return 'bg-emerald-500';
      case 'warm': return 'bg-sky-300';
      default: return 'bg-slate-200';
    }
  };

  const hotCount = prefectures.filter((p) => p.status === 'hot').length;
  const warmCount = prefectures.filter((p) => p.status === 'warm').length;

  return (
    <div className="bg-white rounded-xl border border-sky-100 shadow-sm p-4 lg:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-sky-600" />
          <h3 className="font-semibold text-slate-900 text-sm tracking-wide uppercase">Prefecture Activity</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-emerald-700 font-medium">Active ({hotCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-sky-300" />
            <span className="text-slate-600">Moderate ({warmCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-200" />
            <span className="text-slate-500">Quiet</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-10 sm:grid-cols-20 gap-1.5">
        {prefectures.slice(0, 100).map((pref) => (
          <div
            key={pref.id}
            className={`aspect-square rounded-sm ${getStatusColor(pref.status)} cursor-pointer hover:scale-125 transition-all duration-200 relative group`}
            title={`${pref.name}: ${pref.slotsFound24h} slots`}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-md">
              {pref.name} ({pref.slotsFound24h})
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

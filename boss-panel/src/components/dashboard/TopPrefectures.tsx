'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Trophy } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface TopPref {
  id: string;
  name: string;
  department: string;
  slotsFound24h: number;
  bookingUrl?: string;
}

export default function TopPrefectures() {
  const [prefectures, setPrefectures] = useState<TopPref[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiFetch('/api/boss/top-prefectures');
        if (res.ok) {
          const json = await res.json();
          setPrefectures((json.data || json || []).slice(0, 5));
        }
      } catch { /* ignore */ }
    };
    fetch();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-sky-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Top Prefectures (24h)</h3>
      </div>
      {prefectures.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
      ) : (
        <div className="space-y-2">
          {prefectures.map((pref, i) => (
            <div key={pref.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-sky-50/50 transition-colors">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{pref.name}</p>
                <p className="text-xs text-slate-400">Dept. {pref.department}</p>
              </div>
              <span className="text-sm font-bold text-sky-600">{pref.slotsFound24h}</span>
              {pref.bookingUrl && (
                <a href={pref.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-sky-600">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

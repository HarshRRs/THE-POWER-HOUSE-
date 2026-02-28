'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Zap } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Prefecture {
  id: string;
  name: string;
  department: string;
  slotsFound24h: number;
  bookingUrl: string;
}

export default function TopPrefectures() {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/boss/top-prefectures')
      .then(res => res.json())
      .then(data => {
        setPrefectures(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to empty if API fails
        setPrefectures([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="card p-4 lg:p-5 tech-corner">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-cyan" />
        <h3 className="font-semibold text-white text-sm tracking-wide">TOP PREFECTURES (24H)</h3>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="spinner" />
          </div>
        ) : prefectures.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">
            No slots detected yet
          </div>
        ) : (
          prefectures.map((pref, index) => (
            <div key={pref.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan to-cyan-dark flex items-center justify-center text-xs font-bold text-white shadow-glow-cyan">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-cyan transition-colors">{pref.name}</p>
                  <p className="text-xs text-text-muted">Dept. {pref.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-cyan">{pref.slotsFound24h}</span>
                <a
                  href={pref.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-cyan/20 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-text-muted hover:text-cyan transition-colors" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

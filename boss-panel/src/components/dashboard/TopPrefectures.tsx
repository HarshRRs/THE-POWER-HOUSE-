'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, ExternalLink, Zap } from 'lucide-react';

interface Prefecture {
  id: string;
  name: string;
  department: string;
  slotsFound24h: number;
  bookingUrl: string;
}

export default function TopPrefectures() {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);

  useEffect(() => {
    setPrefectures([
      { id: '1', name: 'Paris', department: '75', slotsFound24h: 12, bookingUrl: '#' },
      { id: '2', name: 'Lyon', department: '69', slotsFound24h: 8, bookingUrl: '#' },
      { id: '3', name: 'Marseille', department: '13', slotsFound24h: 6, bookingUrl: '#' },
      { id: '4', name: 'Bordeaux', department: '33', slotsFound24h: 5, bookingUrl: '#' },
      { id: '5', name: 'Toulouse', department: '31', slotsFound24h: 4, bookingUrl: '#' },
    ]);
  }, []);

  return (
    <div className="card p-4 lg:p-5 tech-corner">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-cyan" />
        <h3 className="font-semibold text-white text-sm tracking-wide">TOP PREFECTURES</h3>
      </div>

      <div className="space-y-3">
        {prefectures.map((pref, index) => (
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
        ))}
      </div>
    </div>
  );
}

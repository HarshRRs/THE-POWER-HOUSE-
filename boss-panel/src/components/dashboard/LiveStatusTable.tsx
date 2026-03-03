'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

interface MatrixCell {
  prefectureId: string;
  prefectureName: string;
  department: string;
  categoryCode: string;
  categoryName: string;
  status: string;
  lastScrapedAt: string | null;
  lastSlotFoundAt: string | null;
  slotsAvailable?: number;
}

const statusConfig: Record<string, { dot: string; label: string; badge: string }> = {
  available: { dot: 'bg-emerald-500', label: 'Available', badge: 'text-emerald-700 bg-emerald-50' },
  recent: { dot: 'bg-sky-500', label: 'Recent', badge: 'text-sky-700 bg-sky-50' },
  no_slots: { dot: 'bg-slate-400', label: 'No Slots', badge: 'text-slate-600 bg-slate-50' },
  not_checked: { dot: 'bg-slate-300', label: 'Not Checked', badge: 'text-slate-500 bg-slate-50' },
  error: { dot: 'bg-red-500', label: 'Error', badge: 'text-red-700 bg-red-50' },
  captcha: { dot: 'bg-amber-500', label: 'CAPTCHA', badge: 'text-amber-700 bg-amber-50' },
};

export default function LiveStatusTable() {
  const [cells, setCells] = useState<MatrixCell[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatrix = async () => {
    try {
      const res = await apiFetch('/api/boss/slot-matrix');
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        const flat: MatrixCell[] = [];
        if (Array.isArray(data)) {
          for (const pref of data) {
            if (pref.categories) {
              for (const cat of pref.categories) {
                flat.push({
                  prefectureId: pref.id || pref.prefectureId,
                  prefectureName: pref.name || pref.prefectureName,
                  department: pref.department || '',
                  categoryCode: cat.code || cat.categoryCode || '',
                  categoryName: cat.name || cat.categoryName || '',
                  status: cat.status || 'not_checked',
                  lastScrapedAt: cat.lastScrapedAt || null,
                  lastSlotFoundAt: cat.lastSlotFoundAt || null,
                  slotsAvailable: cat.slotsAvailable,
                });
              }
            }
          }
        }
        setCells(flat);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatrix();
    const interval = setInterval(fetchMatrix, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-sky-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Live Status</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-sky-50 rounded" />)}
        </div>
      </div>
    );
  }

  const sorted = [...cells].sort((a, b) => {
    const order: Record<string, number> = { available: 0, recent: 1, captcha: 2, error: 3, no_slots: 4, not_checked: 5 };
    return (order[a.status] ?? 5) - (order[b.status] ?? 5);
  });
  const display = sorted.slice(0, 15);

  return (
    <div className="bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-sky-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Live Status</h3>
        <span className="text-xs text-slate-500">{cells.length} categories</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-sky-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Prefecture</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Last Check</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Slots</th>
            </tr>
          </thead>
          <tbody>
            {display.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No data yet</td></tr>
            ) : display.map((cell, i) => {
              const cfg = statusConfig[cell.status] || statusConfig.not_checked;
              return (
                <tr key={i} className="border-t border-sky-50 hover:bg-sky-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-slate-900">{cell.prefectureName}</span>
                    <span className="text-xs text-slate-400 ml-1">({cell.department})</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{cell.categoryName || cell.categoryCode}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {cell.lastScrapedAt ? formatRelativeTime(cell.lastScrapedAt) : '--'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {cell.slotsAvailable ?? '--'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

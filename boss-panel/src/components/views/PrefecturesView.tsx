'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, ExternalLink, ChevronDown, ChevronUp, Play, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatRelativeTime, getProcedureLabel, getPrefectureSystemType } from '@/lib/utils';

interface Prefecture {
  id: string;
  name: string;
  department: string;
  tier: number;
  bookingUrl: string;
  status: string;
  lastScrapedAt: string | null;
  slotsFound24h?: number;
  consecutiveErrors?: number;
  categories?: any[];
}

const statusColors: Record<string, string> = {
  ACTIVE: 'text-emerald-700 bg-emerald-50',
  PAUSED: 'text-slate-600 bg-slate-50',
  ERROR: 'text-red-700 bg-red-50',
  CAPTCHA: 'text-amber-700 bg-amber-50',
};

export default function PrefecturesView() {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiFetch('/api/boss/prefectures');
        if (res.ok) {
          const json = await res.json();
          setPrefectures(json.data || json || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!details[id]) {
      try {
        const res = await apiFetch(`/api/boss/prefecture/${id}/details`);
        if (res.ok) {
          const json = await res.json();
          setDetails(d => ({ ...d, [id]: json.data || json }));
        }
      } catch { /* ignore */ }
    }
  };

  const triggerTest = async (id: string) => {
    setTesting(id);
    try {
      await apiFetch(`/api/boss/prefecture/${id}/check`, { method: 'POST' });
    } catch { /* ignore */ }
    setTimeout(() => setTesting(null), 3000);
  };

  const filtered = prefectures.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.department.includes(search);
    const matchTier = tierFilter === 'ALL' || String(p.tier) === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search prefectures..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="select">
          <option value="ALL">All Tiers</option>
          <option value="1">Tier 1 (IDF)</option>
          <option value="2">Tier 2 (Major)</option>
          <option value="3">Tier 3 (Other)</option>
        </select>
      </div>

      {/* Prefecture Cards */}
      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-sky-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-sky-100 shadow-sm p-12 text-center">
          <MapPin size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No prefectures found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(pref => {
            const isExpanded = expandedId === pref.id;
            const detail = details[pref.id];
            const sysType = getPrefectureSystemType(pref.id);
            const statusCls = statusColors[pref.status] || statusColors.ACTIVE;

            return (
              <div key={pref.id} className="bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 cursor-pointer hover:bg-sky-50/30 transition-colors" onClick={() => toggleExpand(pref.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center text-sm font-bold">
                        {pref.department}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{pref.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{sysType}</span>
                          <span className="text-xs text-slate-300">|</span>
                          <span className="text-xs text-slate-400">Tier {pref.tier}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusCls}`}>{pref.status}</span>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>Last scan: {pref.lastScrapedAt ? formatRelativeTime(pref.lastScrapedAt) : 'Never'}</span>
                    <span>Slots 24h: <strong className="text-sky-600">{pref.slotsFound24h ?? 0}</strong></span>
                    {(pref.consecutiveErrors || 0) > 0 && (
                      <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12} />{pref.consecutiveErrors} errors</span>
                    )}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-sky-50 px-4 pb-4 pt-3 bg-sky-50/20">
                    {detail?.categories?.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {detail.categories.map((cat: any) => (
                          <div key={cat.code || cat.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-sky-50">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{cat.name || getProcedureLabel(cat.procedure || cat.code)}</p>
                              <p className="text-xs text-slate-400">
                                Last: {cat.lastScrapedAt ? formatRelativeTime(cat.lastScrapedAt) : 'Never'}
                                {cat.lastSlotFoundAt && ` | Slot: ${formatRelativeTime(cat.lastSlotFoundAt)}`}
                              </p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColors[cat.categoryStatus] || 'text-slate-500 bg-slate-50'}`}>
                              {cat.categoryStatus || 'ACTIVE'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 mb-3">Loading categories...</p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); triggerTest(pref.id); }} disabled={testing === pref.id}
                        className="btn btn-primary text-xs py-1.5 px-3">
                        <Play size={14} /> {testing === pref.id ? 'Testing...' : 'Manual Test'}
                      </button>
                      {pref.bookingUrl && (
                        <a href={pref.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary text-xs py-1.5 px-3">
                          <ExternalLink size={14} /> Open URL
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

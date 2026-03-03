'use client';

import { useState, useEffect } from 'react';
import { Building2, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

interface EmbassyCategory {
  id: number;
  name: string;
  status: string;
  lastScrapedAt: string | null;
  lastSlotFoundAt: string | null;
  slotsAvailable?: number;
  responseTimeMs?: number;
}

const categoryConfig: Record<number, { label: string; color: string; accent: string }> = {
  3: { label: 'Passport Services', color: 'from-blue-500 to-blue-600', accent: 'text-blue-600 bg-blue-50' },
  1: { label: 'OCI Services', color: 'from-violet-500 to-violet-600', accent: 'text-violet-600 bg-violet-50' },
  2: { label: 'Visa Services', color: 'from-emerald-500 to-emerald-600', accent: 'text-emerald-600 bg-emerald-50' },
  27: { label: 'Birth Registration', color: 'from-amber-500 to-amber-600', accent: 'text-amber-600 bg-amber-50' },
};

const statusIcon: Record<string, { icon: any; color: string; label: string }> = {
  available: { icon: CheckCircle, color: 'text-emerald-500', label: 'Available' },
  no_slots: { icon: XCircle, color: 'text-slate-400', label: 'No Slots' },
  error: { icon: AlertCircle, color: 'text-red-500', label: 'Error' },
  not_checked: { icon: Clock, color: 'text-slate-300', label: 'Not Checked' },
};

export default function EmbassyView() {
  const [categories, setCategories] = useState<EmbassyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<number | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await apiFetch('/api/boss/embassy-status');
      if (res.ok) {
        const json = await res.json();
        setCategories(json.categories || json.data || json || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const triggerCheck = async (catId: number) => {
    setChecking(catId);
    try {
      await apiFetch(`/api/boss/category/indian-embassy-paris/${catId}/check`, { method: 'POST' });
    } catch { /* ignore */ }
    setTimeout(() => { setChecking(null); fetchStatus(); }, 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-sky-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl">&#127470;&#127475;</div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Indian Embassy Paris</h2>
          <p className="text-sm text-slate-500">Real-time appointment slot monitoring for all services</p>
        </div>
      </div>

      {/* Category Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white rounded-xl border border-sky-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[3, 1, 2, 27].map(catId => {
            const config = categoryConfig[catId];
            const cat = categories.find(c => c.id === catId);
            const status = cat?.status || 'not_checked';
            const si = statusIcon[status] || statusIcon.not_checked;
            const StatusIcon = si.icon;

            return (
              <div key={catId} className="bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden">
                {/* Color bar */}
                <div className={`h-1.5 bg-gradient-to-r ${config.color}`} />

                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">{config.label}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.accent}`}>ID: {catId}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Status</span>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon size={14} className={si.color} />
                        <span className="text-sm font-medium text-slate-700">{si.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Last Check</span>
                      <span className="text-sm text-slate-700">{(cat as any)?.lastChecked || cat?.lastScrapedAt ? formatRelativeTime((cat as any)?.lastChecked || cat?.lastScrapedAt) : '--'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Last Slot</span>
                      <span className="text-sm text-slate-700">{(cat as any)?.lastSlotFound || cat?.lastSlotFoundAt ? formatRelativeTime((cat as any)?.lastSlotFound || cat?.lastSlotFoundAt) : 'Never'}</span>
                    </div>
                    {cat?.responseTimeMs && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Response Time</span>
                        <span className="text-sm text-slate-700">{(cat.responseTimeMs / 1000).toFixed(1)}s</span>
                      </div>
                    )}
                  </div>

                  <button onClick={() => triggerCheck(catId)} disabled={checking === catId}
                    className="mt-4 w-full btn btn-secondary text-sm py-2">
                    <RefreshCw size={14} className={checking === catId ? 'animate-spin' : ''} />
                    {checking === catId ? 'Checking...' : 'Check Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

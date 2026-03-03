'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Activity, Server } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function SystemHealth() {
  const [health, setHealth] = useState<any>(null);

  const fetchHealth = async () => {
    try {
      const res = await apiFetch('/api/admin/scraper/status');
      if (res.ok) {
        const json = await res.json();
        setHealth(json.data || json);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    {
      label: 'WebSocket',
      status: 'CONNECTED',
      icon: Wifi,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      detail: 'Real-time updates active',
    },
    {
      label: 'Scraper Queue',
      status: health ? `${health.active || 0} active, ${health.waiting || 0} waiting` : 'Loading...',
      icon: Activity,
      color: (health?.active || 0) > 0 ? 'text-sky-600' : 'text-slate-500',
      bg: (health?.active || 0) > 0 ? 'bg-sky-50' : 'bg-slate-50',
      detail: health ? `${health.completed || 0} completed, ${health.failed || 0} failed` : '',
    },
    {
      label: 'Autobook Queue',
      status: 'IDLE',
      icon: Server,
      color: 'text-slate-500',
      bg: 'bg-slate-50',
      detail: '0 active, 0 waiting',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-sky-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">System Health</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg}`}>
                <Icon size={16} className={item.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{item.label}</span>
                  <span className={`text-xs font-semibold ${item.color}`}>{typeof item.status === 'string' && item.status.length < 15 ? item.status : ''}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{item.detail || item.status}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

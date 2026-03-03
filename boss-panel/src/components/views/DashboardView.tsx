'use client';

import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import PowerStatsGrid from '@/components/dashboard/PowerStatsGrid';
import LiveStatusTable from '@/components/dashboard/LiveStatusTable';
import SystemHealth from '@/components/dashboard/SystemHealth';
import QuickActions from '@/components/dashboard/QuickActions';
import TopPrefectures from '@/components/dashboard/TopPrefectures';

interface DashboardViewProps {
  onNavigate?: (tab: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/boss/power-stats');
      if (res.ok) {
        const json = await res.json();
        setStats(json.data || json);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-600 rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Real-Time Immigration Slot Monitoring System</h2>
          <p className="text-sky-100 text-sm mt-1">All scrapers running. Monitoring prefectures, embassy & VFS centers.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
          <Radio size={14} className="text-emerald-300 animate-pulse" />
          <span className="text-xs font-semibold">LIVE</span>
        </div>
      </div>

      {/* Stats Grid */}
      <PowerStatsGrid stats={stats} />

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Live Table */}
        <div className="lg:col-span-2">
          <LiveStatusTable />
        </div>

        {/* Right - Sidebar widgets */}
        <div className="space-y-6">
          <SystemHealth />
          <QuickActions onNavigate={onNavigate || (() => {})} />
          <TopPrefectures />
        </div>
      </div>
    </div>
  );
}

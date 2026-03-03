'use client';

import { Radar, Tag, CalendarCheck, Clock, Users, MessageCircle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface PowerStatsGridProps {
  stats: any;
}

const statCards = [
  { key: 'scrapers', label: 'Active Scrapers', icon: Radar, color: 'bg-sky-50 text-sky-600' },
  { key: 'categories', label: 'Categories', icon: Tag, color: 'bg-violet-50 text-violet-600' },
  { key: 'slots', label: 'Slots Now', icon: CalendarCheck, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'lastScan', label: 'Last Scan', icon: Clock, color: 'bg-amber-50 text-amber-600' },
  { key: 'clients', label: 'Total Clients', icon: Users, color: 'bg-rose-50 text-rose-600' },
  { key: 'whatsapp', label: 'WhatsApp Sent', icon: MessageCircle, color: 'bg-green-50 text-green-600' },
];

export default function PowerStatsGrid({ stats }: PowerStatsGridProps) {
  const overview = stats?.overview || stats || {};

  const getValue = (key: string) => {
    switch (key) {
      case 'scrapers': return overview.activePrefectures ?? 0;
      case 'categories': return overview.activeCategories ?? 0;
      case 'slots': return stats?.detections?.last24h ?? overview.slotsFound24h ?? 0;
      case 'lastScan': {
        const t = overview.lastScrapedAt;
        return t ? formatRelativeTime(t) : '--';
      }
      case 'clients': return overview.totalClients ?? 0;
      case 'whatsapp': return stats?.whatsappSentToday ?? 0;
      default: return 0;
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = getValue(card.key);
        return (
          <div key={card.key} className="bg-white rounded-xl border border-sky-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <Icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Globe, Clock, CheckCircle } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiFetch } from '@/lib/api';

interface Stats {
  totalConsulates: number;
  totalVfsCenters: number;
  slotsFound24h: number;
  slotsFound7d: number;
  successRate: number;
}

export default function StatsCards() {
  const { data } = useWebSocket();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (data?.recentDetections && stats) {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const slots24h = data.recentDetections.filter(
        (d) => new Date(d.detectedAt ?? d.timestamp ?? '') > last24h
      ).length;

      const slots7d = data.recentDetections.filter(
        (d) => new Date(d.detectedAt ?? d.timestamp ?? '') > last7d
      ).length;

      setStats((prev) => prev ? ({
        ...prev,
        slotsFound24h: slots24h,
        slotsFound7d: slots7d,
      }) : prev);
    }
  }, [data]);

  useEffect(() => {
    apiFetch('/api/boss/stats')
      .then((res) => res.json())
      .then((apiStats) => {
        setStats((prev) => ({
          totalConsulates: 0,
          totalVfsCenters: 0,
          slotsFound24h: 0,
          slotsFound7d: 0,
          successRate: 0,
          ...prev,
          ...apiStats,
        }));
      })
      .catch(() => {});
  }, []);

  const cards = [
    {
      label: 'VFS Centers',
      value: stats?.totalVfsCenters ?? '--',
      icon: Globe,
      color: 'blue',
    },
    {
      label: 'Slots 24h',
      value: stats?.slotsFound24h ?? '--',
      icon: Clock,
      color: 'green',
    },
    {
      label: 'Slots 7d',
      value: stats?.slotsFound7d ?? '--',
      icon: CheckCircle,
      color: 'purple',
    },
  ];

  const getIconBg = (color: string) => {
    const colors: Record<string, string> = {
      cyan: 'from-cyan to-cyan-dark shadow-glow-cyan',
      blue: 'from-blue-500 to-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.4)]',
      green: 'from-emerald-500 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
      purple: 'from-violet-500 to-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.4)]',
      red: 'from-red-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <div key={index} className="card p-4 lg:p-5 card-hover tech-corner">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getIconBg(card.color)} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl lg:text-3xl font-bold text-white">
                {card.value}
              </p>
              <p className="text-xs text-cyan mt-1 uppercase tracking-wider font-medium">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

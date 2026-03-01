"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle, Globe, Plane } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Stats {
  totalConsulates: number;
  totalVfsCenters: number;
  slotsFound24h: number;
  slotsFound7d: number;
  successRate: number;
}

export default function StatsGrid() {
  const { data } = useWebSocket();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate stats from WebSocket data
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

  // Also fetch from API for initial load
  useEffect(() => {
    fetch("/api/boss/stats")
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
      .catch((err) => console.error("Failed to fetch stats:", err))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: "Consulates",
      value: stats?.totalConsulates ?? "--",
      icon: Globe,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
    {
      label: "VFS Centers",
      value: stats?.totalVfsCenters ?? "--",
      icon: Plane,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Slots 24h",
      value: stats?.slotsFound24h ?? "--",
      icon: Clock,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Slots 7d",
      value: stats?.slotsFound7d ?? "--",
      icon: CheckCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {statCards.map((card, index) => (
        <div
          key={index}
          className="glass rounded-xl p-3 lg:p-4 border border-border hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted text-xs lg:text-sm">{card.label}</p>
              <p className="text-xl lg:text-2xl font-bold mt-1">
                {card.value}
              </p>
            </div>
            <div className={`p-2 lg:p-3 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 lg:h-5 lg:w-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

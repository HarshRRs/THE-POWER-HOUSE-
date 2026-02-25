"use client";

import { useEffect, useState } from "react";
import { MapPin, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Stats {
  totalPrefectures: number;
  activePrefectures: number;
  slotsFound24h: number;
  slotsFound7d: number;
  successRate: number;
}

export default function StatsGrid() {
  const { isConnected, data } = useWebSocket();
  const [stats, setStats] = useState<Stats>({
    totalPrefectures: 101,
    activePrefectures: 101,
    slotsFound24h: 0,
    slotsFound7d: 0,
    successRate: 94,
  });

  // Calculate stats from WebSocket data
  useEffect(() => {
    if (data?.recentDetections) {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const slots24h = data.recentDetections.filter(
        (d) => new Date(d.detectedAt) > last24h
      ).length;

      const slots7d = data.recentDetections.filter(
        (d) => new Date(d.detectedAt) > last7d
      ).length;

      setStats((prev) => ({
        ...prev,
        slotsFound24h: slots24h,
        slotsFound7d: slots7d,
      }));
    }
  }, [data]);

  // Also fetch from API for initial load
  useEffect(() => {
    fetch("/api/boss/stats")
      .then((res) => res.json())
      .then((apiStats) => {
        setStats((prev) => ({
          ...prev,
          ...apiStats,
        }));
      })
      .catch((err) => console.error("Failed to fetch stats:", err));
  }, []);

  const statCards = [
    {
      label: "Préfectures",
      value: stats.activePrefectures,
      total: stats.totalPrefectures,
      icon: MapPin,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Créneaux 24h",
      value: stats.slotsFound24h,
      icon: Clock,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Créneaux 7j",
      value: stats.slotsFound7d,
      icon: CheckCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Connexion",
      value: isConnected ? "ONLINE" : "OFFLINE",
      icon: TrendingUp,
      color: isConnected ? "text-success" : "text-danger",
      bgColor: isConnected ? "bg-success/10" : "bg-danger/10",
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
                {card.total && (
                  <span className="text-muted text-xs font-normal">
                    {" "}
                    / {card.total}
                  </span>
                )}
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

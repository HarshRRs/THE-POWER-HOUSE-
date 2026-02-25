"use client";

import { useState, useEffect } from "react";
import { MapPin, Clock, CheckCircle, TrendingUp } from "lucide-react";

interface Stats {
  totalPrefectures: number;
  activePrefectures: number;
  slotsFound24h: number;
  slotsFound7d: number;
}

export default function StatsGrid() {
  const [stats, setStats] = useState<Stats>({
    totalPrefectures: 101,
    activePrefectures: 101,
    slotsFound24h: 0,
    slotsFound7d: 0,
  });

  useEffect(() => {
    // Fetch stats from API
    fetch("/api/boss/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {
        // Use default values if API not available
      });
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
      label: "Taux de succès",
      value: "94%",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((card, index) => (
        <div
          key={index}
          className="glass rounded-xl p-4 border border-border hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted text-sm">{card.label}</p>
              <p className="text-2xl font-bold mt-1">
                {typeof card.value === "number" ? card.value : card.value}
                {card.total && (
                  <span className="text-muted text-sm font-normal">
                    {" "}
                    / {card.total}
                  </span>
                )}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

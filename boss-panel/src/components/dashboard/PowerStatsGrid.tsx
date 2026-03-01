'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  Zap,
  Users,
  DollarSign,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  Shield,
  Server,
  Activity,
} from 'lucide-react';

interface PowerStats {
  overview: {
    activePrefectures: number;
    activeCategories: number;
    totalClients: number;
    systemOnline: boolean;
  };
  detections: {
    last24h: number;
    last7d: number;
    topPrefectures: Array<{
      prefectureId: string;
      name: string;
      department: string;
      count: number;
    }>;
  };
  pipeline: {
    waiting: number;
    booking: number;
    booked: number;
    failed: number;
    successRate: number;
  };
  revenue: {
    totalAgreed: number;
    totalCollected: number;
    totalPending: number;
  };
  costs: {
    captchaSolves24h: number;
    captchaCost24h: number;
    estimatedMonthlyCost: number;
  };
  queues: {
    scraper: { waiting: number; active: number; completed: number; failed: number };
    autobook: { waiting: number; active: number; completed: number; failed: number };
  };
  generatedAt: string;
}

export default function PowerStatsGrid() {
  const [stats, setStats] = useState<PowerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useWebSocket();

  const fetchStats = async () => {
    try {
      const response = await apiFetch('/api/boss/power-stats');
      if (!response.ok) {
        console.error('Power stats API error:', response.status);
        return;
      }
      const json = await response.json();
      // Handle both wrapped {success, data} and direct response formats
      const data = json.data || json;
      if (data && data.overview) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch power stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-10 w-10 bg-gray-700 rounded-lg mb-3" />
            <div className="h-8 w-16 bg-gray-700 rounded mb-2" />
            <div className="h-4 w-20 bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats || !stats.detections || !stats.pipeline || !stats.revenue || !stats.overview || !stats.costs || !stats.queues) {
    return (
      <div className="card p-6 text-center">
        <p className="text-text-muted">Unable to load stats. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Slots Detected */}
        <StatCard
          icon={Zap}
          label="Slots 24h"
          value={stats.detections.last24h}
          color="cyan"
          trend={stats.detections.last7d > 0 ? `${Math.round((stats.detections.last24h / (stats.detections.last7d / 7)) * 100)}% vs avg` : undefined}
        />

        {/* Clients Waiting */}
        <StatCard
          icon={Clock}
          label="Waiting"
          value={stats.pipeline.waiting}
          color="yellow"
          subtitle="clients in queue"
        />

        {/* Currently Booking */}
        <StatCard
          icon={Loader2}
          label="Booking"
          value={stats.pipeline.booking}
          color="blue"
          animate={stats.pipeline.booking > 0}
        />

        {/* Successfully Booked */}
        <StatCard
          icon={CheckCircle2}
          label="Booked"
          value={stats.pipeline.booked}
          color="green"
          subtitle={`${stats.pipeline.successRate}% success`}
        />

        {/* Revenue Collected */}
        <StatCard
          icon={DollarSign}
          label="Collected"
          value={`€${stats.revenue.totalCollected.toLocaleString()}`}
          color="emerald"
          subtitle={`€${stats.revenue.totalPending.toLocaleString()} pending`}
        />

        {/* System Status */}
        <StatCard
          icon={Server}
          label="System"
          value={isConnected ? 'ONLINE' : 'OFFLINE'}
          color={isConnected ? 'cyan' : 'red'}
          subtitle={`${stats.overview.activePrefectures} prefectures`}
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Categories Monitored */}
        <MiniStatCard
          icon={Target}
          label="Categories"
          value={stats.overview.activeCategories}
          color="purple"
        />

        {/* Total Clients */}
        <MiniStatCard
          icon={Users}
          label="Total Clients"
          value={stats.overview.totalClients}
          color="indigo"
        />

        {/* CAPTCHA Cost */}
        <MiniStatCard
          icon={Shield}
          label="CAPTCHA 24h"
          value={`$${stats.costs.captchaCost24h.toFixed(2)}`}
          color="orange"
        />

        {/* Queue Status */}
        <MiniStatCard
          icon={Activity}
          label="Queue Jobs"
          value={stats.queues.scraper.waiting + stats.queues.autobook.waiting}
          color="teal"
        />
      </div>

      {/* Booking Pipeline Visualization */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          BOOKING PIPELINE
        </h3>
        <div className="flex items-center gap-2">
          <PipelineStep
            label="Waiting"
            count={stats.pipeline.waiting}
            color="yellow"
            isFirst
          />
          <PipelineArrow />
          <PipelineStep
            label="Booking"
            count={stats.pipeline.booking}
            color="blue"
            pulse={stats.pipeline.booking > 0}
          />
          <PipelineArrow />
          <PipelineStep
            label="Booked"
            count={stats.pipeline.booked}
            color="green"
          />
          <div className="mx-2 text-text-muted">|</div>
          <PipelineStep
            label="Failed"
            count={stats.pipeline.failed}
            color="red"
          />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  subtitle,
  trend,
  animate,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
  trend?: string;
  animate?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    cyan: 'from-cyan-500 to-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    yellow: 'from-yellow-500 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.4)]',
    blue: 'from-blue-500 to-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.4)]',
    green: 'from-green-500 to-green-600 shadow-[0_0_15px_rgba(34,197,94,0.4)]',
    emerald: 'from-emerald-500 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    red: 'from-red-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    purple: 'from-purple-500 to-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
  };

  return (
    <div className="card p-4 card-hover tech-corner">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color] || colorClasses.cyan} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 text-white ${animate ? 'animate-spin' : ''}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-cyan uppercase tracking-wider font-medium mt-1">{label}</p>
      {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
      {trend && <p className="text-xs text-green-400 mt-1">{trend}</p>}
    </div>
  );
}

// Mini Stat Card
function MiniStatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: 'text-purple-400 bg-purple-500/10',
    indigo: 'text-indigo-400 bg-indigo-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    teal: 'text-teal-400 bg-teal-500/10',
  };

  return (
    <div className="card p-3 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg ${colorClasses[color] || colorClasses.purple} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}

// Pipeline Step
function PipelineStep({
  label,
  count,
  color,
  isFirst,
  pulse,
}: {
  label: string;
  count: number;
  color: string;
  isFirst?: boolean;
  pulse?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    blue: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    green: 'bg-green-500/20 border-green-500/50 text-green-400',
    red: 'bg-red-500/20 border-red-500/50 text-red-400',
  };

  return (
    <div className={`flex-1 p-3 rounded-lg border ${colorClasses[color]} ${pulse ? 'animate-pulse' : ''}`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}

// Pipeline Arrow
function PipelineArrow() {
  return (
    <div className="text-text-muted flex-shrink-0">
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

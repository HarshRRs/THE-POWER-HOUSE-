'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  Server,
  Wifi,
  WifiOff,
  Database,
  Cpu,
  HardDrive,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

interface SystemHealthData {
  queues: {
    scraper: QueueStats;
    autobook: QueueStats;
  };
  connections: number;
}

export default function SystemHealth() {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isConnected, latestDetection } = useWebSocket();

  const fetchHealth = async () => {
    try {
      const [powerStatsRes, connectionsRes] = await Promise.all([
        apiFetch('/api/boss/power-stats'),
        apiFetch('/api/boss/connections'),
      ]);
      
      const powerStatsJson = powerStatsRes.ok ? await powerStatsRes.json() : null;
      const connectionsJson = connectionsRes.ok ? await connectionsRes.json() : null;
      
      // Handle both wrapped {success, data} and direct response formats
      const powerStats = powerStatsJson?.data || powerStatsJson;
      const connections = connectionsJson?.data || connectionsJson;
      
      if (powerStats?.queues) {
        setHealth({
          queues: powerStats.queues,
          connections: connections?.activeConnections || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const getQueueStatus = (queue: QueueStats) => {
    if (queue.failed > 5) return 'error';
    if (queue.waiting > 50) return 'warning';
    if (queue.active > 0) return 'active';
    return 'idle';
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'active':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-6 w-32 bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-muted flex items-center gap-2">
          <Server className="w-4 h-4" />
          SYSTEM HEALTH
        </h3>
        <button
          onClick={fetchHealth}
          className="p-1.5 rounded-lg hover:bg-surface transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
        </button>
      </div>

      <div className="space-y-3">
        {/* WebSocket Connection */}
        <HealthRow
          icon={isConnected ? Wifi : WifiOff}
          label="WebSocket"
          status={isConnected ? 'connected' : 'disconnected'}
          statusColor={isConnected ? 'green' : 'red'}
          detail={isConnected ? 'Real-time updates active' : 'Reconnecting...'}
        />

        {/* Scraper Queue */}
        {health && (
          <HealthRow
            icon={Cpu}
            label="Scraper Queue"
            status={getQueueStatus(health.queues.scraper)}
            statusColor={getQueueStatusColor(getQueueStatus(health.queues.scraper))}
            detail={`${health.queues.scraper.active} active, ${health.queues.scraper.waiting} waiting`}
            rightContent={
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-400">{health.queues.scraper.completed}</span>
                <span className="text-text-muted">/</span>
                <span className="text-red-400">{health.queues.scraper.failed}</span>
              </div>
            }
          />
        )}

        {/* Autobook Queue */}
        {health && (
          <HealthRow
            icon={HardDrive}
            label="Autobook Queue"
            status={getQueueStatus(health.queues.autobook)}
            statusColor={getQueueStatusColor(getQueueStatus(health.queues.autobook))}
            detail={`${health.queues.autobook.active} active, ${health.queues.autobook.waiting} waiting`}
            rightContent={
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-400">{health.queues.autobook.completed}</span>
                <span className="text-text-muted">/</span>
                <span className="text-red-400">{health.queues.autobook.failed}</span>
              </div>
            }
          />
        )}

        {/* Active Connections */}
        {health && (
          <HealthRow
            icon={Database}
            label="Connections"
            status="active"
            statusColor="cyan"
            detail={`${health.connections} WebSocket clients`}
          />
        )}
      </div>

      {/* Last Detection Timestamp */}
      {latestDetection && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Last Detection</span>
            <span className="text-cyan">
              {latestDetection.prefectureName || latestDetection.vfsCenterName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function HealthRow({
  icon: Icon,
  label,
  status,
  statusColor,
  detail,
  rightContent,
}: {
  icon: React.ElementType;
  label: string;
  status: string;
  statusColor: string;
  detail: string;
  rightContent?: React.ReactNode;
}) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-500/10 text-green-400',
    red: 'bg-red-500/10 text-red-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    blue: 'bg-blue-500/10 text-blue-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-surface/50">
      <div className={`w-8 h-8 rounded-lg ${colorClasses[statusColor] || colorClasses.cyan} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{label}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${colorClasses[statusColor]}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-text-muted truncate">{detail}</p>
      </div>
      {rightContent}
    </div>
  );
}

function getQueueStatusColor(status: string): string {
  switch (status) {
    case 'error':
      return 'red';
    case 'warning':
      return 'yellow';
    case 'active':
      return 'blue';
    default:
      return 'green';
  }
}

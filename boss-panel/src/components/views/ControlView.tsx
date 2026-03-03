'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Play, Square, RefreshCw, Server, Cpu, HardDrive, MemoryStick,
  Gauge, AlertTriangle, CheckCircle2, XCircle, Settings, Zap,
  ChevronDown, ChevronUp, Terminal, Wifi, WifiOff, Clock,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

interface ScraperStatus {
  running: boolean;
  lastRunAt?: string;
  queueDepth?: number;
  activePrefectures?: number;
  activeCategories?: number;
  scraperInterval?: number;
}

interface ServerHealth {
  cpuPercent: number;
  memoryPercent: number;
  memoryUsedMB: number;
  memoryTotalMB: number;
  diskPercent: number;
  uptime: number;
}

interface LogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: string;
  source?: string;
}

export default function ControlView() {
  const [scraper, setScraper] = useState<ScraperStatus>({ running: false });
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchScraperStatus = async () => {
    try {
      const res = await apiFetch('/api/admin/scraper/status');
      if (res.ok) {
        const json = await res.json();
        const d = json.data || json;
        setScraper({
          running: d.running ?? d.isRunning ?? d.status === 'running',
          lastRunAt: d.lastRunAt || d.lastRun,
          queueDepth: d.queueDepth ?? d.queue?.length ?? 0,
          activePrefectures: d.activePrefectures ?? d.prefectureCount ?? 0,
          activeCategories: d.activeCategories ?? d.categoryCount ?? 0,
          scraperInterval: d.scraperInterval ?? d.interval,
        });
      }
    } catch { /* ignore */ }
  };

  const fetchServerHealth = async () => {
    try {
      const res = await apiFetch('/api/admin/server/health');
      if (res.ok) {
        const json = await res.json();
        const d = json.data || json;
        setHealth({
          cpuPercent: d.cpuPercent ?? d.cpu ?? 0,
          memoryPercent: d.memoryPercent ?? d.memory?.percent ?? 0,
          memoryUsedMB: d.memoryUsedMB ?? d.memory?.used ?? 0,
          memoryTotalMB: d.memoryTotalMB ?? d.memory?.total ?? 0,
          diskPercent: d.diskPercent ?? d.disk?.percent ?? 0,
          uptime: d.uptime ?? 0,
        });
      }
    } catch { /* ignore */ }
  };

  const fetchLogs = async () => {
    try {
      const res = await apiFetch('/api/admin/logs?limit=50');
      if (res.ok) {
        const json = await res.json();
        const raw = json.data || json || {};
        const list = Array.isArray(raw) ? raw : raw.logs || [];
        if (Array.isArray(list)) {
          setLogs(list.map((l: any, i: number) => ({
            id: l.id || `log-${i}`,
            level: l.level || 'INFO',
            message: l.message || l.msg || '',
            timestamp: l.timestamp || l.createdAt || new Date().toISOString(),
            source: l.source || l.module,
          })));
        }
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    Promise.all([fetchScraperStatus(), fetchServerHealth(), fetchLogs()]).then(() => setLoading(false));
    const healthInterval = setInterval(fetchServerHealth, 10000);
    const scraperInterval = setInterval(fetchScraperStatus, 15000);
    return () => { clearInterval(healthInterval); clearInterval(scraperInterval); };
  }, []);

  const handleScraperAction = async (action: 'start' | 'stop') => {
    setActionLoading(action);
    try {
      await apiFetch(`/api/admin/scraper/${action}`, { method: 'POST' });
      await fetchScraperStatus();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleRefreshLogs = async () => {
    setActionLoading('logs');
    await fetchLogs();
    setActionLoading(null);
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatUptime = (seconds: number): string => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getLogLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'text-red-600 bg-red-50';
      case 'WARN': case 'WARNING': return 'text-amber-600 bg-amber-50';
      case 'INFO': return 'text-sky-600 bg-sky-50';
      case 'DEBUG': return 'text-slate-500 bg-slate-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const filteredLogs = logFilter === 'ALL' ? logs : logs.filter(l => l.level.toUpperCase() === logFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
        <span className="ml-3 text-slate-500">Loading system controls...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scraper Control Panel */}
      <div className="bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-sky-50/30"
          onClick={() => toggleSection('scraper')}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${scraper.running ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Scraper Control</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {scraper.running ? 'Running' : 'Stopped'} &bull; Queue: {scraper.queueDepth || 0} &bull; {scraper.activePrefectures || 0} prefectures
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${scraper.running ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${scraper.running ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {scraper.running ? 'ACTIVE' : 'INACTIVE'}
            </span>
            {expandedSection === 'scraper' ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </div>
        </div>
        {expandedSection === 'scraper' && (
          <div className="px-6 pb-5 border-t border-sky-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 bg-sky-50/50 rounded-lg">
                <p className="text-xs text-slate-500">Prefectures</p>
                <p className="text-lg font-bold text-slate-900">{scraper.activePrefectures || 0}</p>
              </div>
              <div className="text-center p-3 bg-sky-50/50 rounded-lg">
                <p className="text-xs text-slate-500">Categories</p>
                <p className="text-lg font-bold text-slate-900">{scraper.activeCategories || 0}</p>
              </div>
              <div className="text-center p-3 bg-sky-50/50 rounded-lg">
                <p className="text-xs text-slate-500">Queue Depth</p>
                <p className="text-lg font-bold text-slate-900">{scraper.queueDepth || 0}</p>
              </div>
              <div className="text-center p-3 bg-sky-50/50 rounded-lg">
                <p className="text-xs text-slate-500">Last Run</p>
                <p className="text-sm font-bold text-slate-900">{scraper.lastRunAt ? formatRelativeTime(scraper.lastRunAt) : '--'}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleScraperAction('start')}
                disabled={scraper.running || actionLoading === 'start'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'start' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                Start Scraper
              </button>
              <button
                onClick={() => handleScraperAction('stop')}
                disabled={!scraper.running || actionLoading === 'stop'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'stop' ? <RefreshCw size={14} className="animate-spin" /> : <Square size={14} />}
                Stop Scraper
              </button>
              <button
                onClick={fetchScraperStatus}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Server Health */}
      <div className="bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-sky-50/30"
          onClick={() => toggleSection('health')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <Server size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Server Health</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                CPU: {health?.cpuPercent?.toFixed(0) || 0}% &bull; RAM: {health?.memoryPercent?.toFixed(0) || 0}% &bull; Uptime: {health ? formatUptime(health.uptime) : '--'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {health && (health.cpuPercent > 90 || health.memoryPercent > 90) ? (
              <AlertTriangle size={18} className="text-amber-500" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-500" />
            )}
            {expandedSection === 'health' ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </div>
        </div>
        {expandedSection === 'health' && health && (
          <div className="px-6 pb-5 border-t border-sky-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* CPU */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-sky-600" />
                    <span className="text-sm font-medium text-slate-700">CPU</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{health.cpuPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getProgressColor(health.cpuPercent)}`} style={{ width: `${Math.min(100, health.cpuPercent)}%` }} />
                </div>
              </div>
              {/* Memory */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MemoryStick size={16} className="text-violet-600" />
                    <span className="text-sm font-medium text-slate-700">Memory</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{health.memoryPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getProgressColor(health.memoryPercent)}`} style={{ width: `${Math.min(100, health.memoryPercent)}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{health.memoryUsedMB}MB / {health.memoryTotalMB}MB</p>
              </div>
              {/* Disk */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive size={16} className="text-amber-600" />
                    <span className="text-sm font-medium text-slate-700">Disk</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{health.diskPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getProgressColor(health.diskPercent)}`} style={{ width: `${Math.min(100, health.diskPercent)}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Clock size={12} /> Uptime: {formatUptime(health.uptime)} &bull; Auto-refresh every 10s
            </div>
          </div>
        )}
      </div>

      {/* System Logs */}
      <div className="bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600">
              <Terminal size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">System Logs</h3>
              <p className="text-xs text-slate-500 mt-0.5">{filteredLogs.length} entries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Log level filter */}
            <div className="flex gap-1">
              {['ALL', 'ERROR', 'WARN', 'INFO'].map(level => (
                <button
                  key={level}
                  onClick={() => setLogFilter(level)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${logFilter === level ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  {level}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefreshLogs}
              disabled={actionLoading === 'logs'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <RefreshCw size={12} className={actionLoading === 'logs' ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
        <div className="border-t border-sky-50 max-h-80 overflow-y-auto font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400">
              No logs available
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredLogs.map((log) => (
                <div key={log.id} className="px-4 py-2 hover:bg-slate-50/50 flex items-start gap-3">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 mt-0.5 ${getLogLevelColor(log.level)}`}>
                    {log.level.substring(0, 4)}
                  </span>
                  <span className="text-slate-400 shrink-0 mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {log.source && <span className="text-sky-500 shrink-0 mt-0.5">[{log.source}]</span>}
                  <span className="text-slate-700 break-all">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Clear Cache */}
        <ActionCard
          icon={<RefreshCw size={18} />}
          title="Clear Cache"
          description="Reset scraper cache and session data"
          buttonLabel="Clear"
          buttonColor="bg-amber-600 hover:bg-amber-700"
          endpoint="/api/admin/cache/clear"
        />
        {/* Force Full Scan */}
        <ActionCard
          icon={<Gauge size={18} />}
          title="Force Full Scan"
          description="Trigger immediate scan of all prefectures"
          buttonLabel="Scan Now"
          buttonColor="bg-sky-600 hover:bg-sky-700"
          endpoint="/api/admin/scraper/force-scan"
        />
        {/* Restart Workers */}
        <ActionCard
          icon={<Settings size={18} />}
          title="Restart Workers"
          description="Restart background job workers"
          buttonLabel="Restart"
          buttonColor="bg-violet-600 hover:bg-violet-700"
          endpoint="/api/admin/workers/restart"
        />
      </div>
    </div>
  );
}

/** Reusable action card component */
function ActionCard({ icon, title, description, buttonLabel, buttonColor, endpoint }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  buttonColor: string;
  endpoint: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const handleAction = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await apiFetch(endpoint, { method: 'POST' });
      setResult(res.ok ? 'success' : 'error');
    } catch {
      setResult('error');
    }
    setLoading(false);
    setTimeout(() => setResult(null), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-sky-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-sky-50 text-sky-600">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button
        onClick={handleAction}
        disabled={loading}
        className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${buttonColor}`}
      >
        {loading ? <RefreshCw size={14} className="animate-spin" /> : result === 'success' ? <CheckCircle2 size={14} /> : result === 'error' ? <XCircle size={14} /> : null}
        {loading ? 'Processing...' : result === 'success' ? 'Done!' : result === 'error' ? 'Failed' : buttonLabel}
      </button>
    </div>
  );
}

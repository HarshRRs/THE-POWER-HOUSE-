'use client';

import { useState, useEffect } from 'react';
import { Building2, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface CategoryStatus {
  id: number;
  name: string;
  code: string;
  status: 'available' | 'recent' | 'no_slots' | 'not_checked' | 'error';
  slotsCount: number;
  slotDates: Array<{ date: string; times: string[] }> | null;
  lastChecked: string | null;
  lastSlotFound: string | null;
  errorMessage: string | null;
}

interface EmbassyStatus {
  id: string;
  name: string;
  baseUrl: string;
  categories: CategoryStatus[];
  lastUpdated: string;
}

const STATUS_CONFIG = {
  available: { color: 'bg-emerald-500', text: 'Slots Available', icon: CheckCircle },
  recent: { color: 'bg-amber-500', text: 'Recent Slots', icon: Clock },
  no_slots: { color: 'bg-gray-500', text: 'No Slots', icon: XCircle },
  not_checked: { color: 'bg-blue-500', text: 'Not Checked', icon: AlertCircle },
  error: { color: 'bg-red-500', text: 'Error', icon: AlertCircle },
};

const CATEGORY_COLORS: Record<number, string> = {
  3: 'from-blue-600 to-blue-800',      // Passport
  1: 'from-emerald-600 to-emerald-800', // OCI
  2: 'from-purple-600 to-purple-800',   // Visa
  27: 'from-amber-600 to-amber-800',    // Birth
};

export default function EmbassyView() {
  const [data, setData] = useState<EmbassyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await apiFetch('/api/boss/embassy-status');
      if (!response.ok) throw new Error('Failed to fetch');
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError('Failed to load embassy status');
      console.error('Embassy fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">{error || 'No data available'}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{data.name}</h2>
              <p className="text-gray-400">Real-time appointment monitoring</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Live
            </div>
            <p className="text-xs text-gray-500">Updated {formatTime(data.lastUpdated)}</p>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.categories.map((cat) => {
          const statusConfig = STATUS_CONFIG[cat.status];
          const StatusIcon = statusConfig.icon;
          const gradientColor = CATEGORY_COLORS[cat.id] || 'from-gray-600 to-gray-800';

          return (
            <div key={cat.id} className="card card-hover overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${gradientColor}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{cat.name}</h3>
                    <p className="text-sm text-gray-400">{cat.code}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${statusConfig.color} flex items-center gap-2`}>
                    <StatusIcon className="w-4 h-4 text-white" />
                    <span className="text-sm font-medium text-white">{statusConfig.text}</span>
                  </div>
                </div>

                {cat.status === 'available' && cat.slotsCount > 0 && (
                  <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                    <p className="text-emerald-400 font-bold text-lg">
                      {cat.slotsCount} slot{cat.slotsCount > 1 ? 's' : ''} found!
                    </p>
                    {cat.slotDates && cat.slotDates.length > 0 && (
                      <p className="text-sm text-emerald-300 mt-1">
                        Next: {cat.slotDates[0].date} at {cat.slotDates[0].times[0]}
                      </p>
                    )}
                  </div>
                )}

                {cat.status === 'error' && cat.errorMessage && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{cat.errorMessage}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Last Checked</p>
                    <p className="text-gray-300">{formatTime(cat.lastChecked)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Slot Found</p>
                    <p className="text-gray-300">{formatTime(cat.lastSlotFound)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking URL */}
      <div className="card p-4">
        <p className="text-sm text-gray-400">
          Booking URL:{' '}
          <a href={data.baseUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
            {data.baseUrl}
          </a>
        </p>
      </div>
    </div>
  );
}
